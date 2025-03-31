import {Contract, formatEther, getAddress} from 'ethers';

import {env} from '../config';
import {redis} from '../db';
import {logger} from '../lib/logger';

import {ERC721_ABI} from './erc721.abi';
import {readEvents} from './indexer.service';
import {provider} from './provider';
import {getTipFeed} from './tip.service';

export interface IShowcaseItem {
  tokenId: string;
  minter: string;
  name: string;
  image: string;
  rarity: string;
}

export interface IPublicStats {
  chainId: number;
  passContract: string;
  tipJarContract: string;
  passesMinted: number;
  holders: number;
  tipsTotalEth: string;
  tipCount: number;
  /** The most recently minted passes, with their art, ready to render. */
  showcase: IShowcaseItem[];
  deployed: boolean;
}

const PASS_STATS_ABI = [
  ...ERC721_ABI,
  'function minterOf(uint256) view returns (address)',
  'function seedOf(uint256) view returns (uint256)',
  'function rarityOf(uint256 seed) view returns (string)',
  'event Claimed(address indexed minter, uint256 indexed tokenId, uint256 seed)',
];

interface IPassStats {
  totalSupply(): Promise<bigint>;
  ownerOf(tokenId: string): Promise<string>;
  tokenURI(tokenId: string): Promise<string>;
  minterOf(tokenId: string): Promise<string>;
  rarityOf(seed: bigint): Promise<string>;
}

const pass = new Contract(env.web3.nftContract, PASS_STATS_ABI, provider) as unknown as IPassStats;

const CACHE_KEY = `stats:${env.web3.chainId}:${env.web3.nftContract.toLowerCase()}`;
const CACHE_TTL_SEC = 60;
const SHOWCASE_SIZE = 8;

/** The metadata is a base64 data: URI — the chain is the whole answer. */
const decodeMetadata = (uri: string): {name: string; image: string} => {
  const payload = uri.slice(uri.indexOf(',') + 1);
  const json = JSON.parse(Buffer.from(payload, 'base64').toString('utf8')) as {
    name: string;
    image: string;
  };

  return {name: json.name, image: json.image};
};

/**
 * Everything the landing page shows, read from the chain.
 *
 * The point of this endpoint is that a visitor sees real numbers and real art
 * without connecting anything — no wallet, no account. A landing page that
 * demands a wallet before it will explain itself is a landing page nobody reads.
 */
const readStats = async (): Promise<IPublicStats> => {
  const [totalSupply, tips, claims] = await Promise.all([
    pass.totalSupply(),
    getTipFeed(),
    readEvents(env.web3.nftContract, 'Claimed'),
  ]);

  const recent = claims.slice(-SHOWCASE_SIZE).reverse();

  const showcase = await Promise.all(
    recent.map(async ({args}) => {
      const tokenId = args.tokenId ?? '0';

      // tokenURI and rarityOf are plain contract calls — those a public node is
      // happy to answer. It is only historical *logs* it refuses, and those now
      // come from the index.
      const [uri, rarity] = await Promise.all([
        pass.tokenURI(tokenId),
        pass.rarityOf(BigInt(args.seed ?? '0')),
      ]);

      const {name, image} = decodeMetadata(uri);

      return {
        tokenId,
        minter: getAddress(args.minter ?? '0x0000000000000000000000000000000000000000'),
        name,
        image,
        rarity,
      };
    }),
  );

  // A pass can be traded after the mint, so the number of distinct *minters* is
  // the honest count of people who have taken part.
  const holders = new Set(claims.map(({args}) => (args.minter ?? '').toLowerCase())).size;

  logger.debug({passes: Number(totalSupply)}, 'stats read');

  return {
    chainId: env.web3.chainId,
    passContract: env.web3.nftContract,
    tipJarContract: env.web3.tipJar,
    passesMinted: Number(totalSupply),
    holders,
    tipsTotalEth: tips.totalTipsEth,
    tipCount: tips.tipCount,
    showcase,
    deployed: true,
  };
};

const emptyStats = (): IPublicStats => ({
  chainId: env.web3.chainId,
  passContract: env.web3.nftContract,
  tipJarContract: env.web3.tipJar,
  passesMinted: 0,
  holders: 0,
  tipsTotalEth: '0.0',
  tipCount: 0,
  showcase: [],
  deployed: false,
});

export const getPublicStats = async ({refresh = false} = {}): Promise<IPublicStats> => {
  if (!refresh) {
    const cached = await redis.get(CACHE_KEY);

    if (cached) {
      return JSON.parse(cached) as IPublicStats;
    }
  }

  let stats: IPublicStats;

  try {
    stats = await readStats();
  } catch (err) {
    // The landing page is the first thing anyone sees. It renders with zeros
    // rather than not rendering at all.
    logger.warn({err}, 'stats unreadable — serving zeros');
    stats = emptyStats();
  }

  await redis.setEx(CACHE_KEY, CACHE_TTL_SEC, JSON.stringify(stats));

  return stats;
};

export const formatEth = formatEther;

export interface ICollectorEntry {
  rank: number;
  address: string;
  /** Passes are one per wallet; artifacts are not. Both count as "collected". */
  tokens: number;
  passes: number;
  artifacts: number;
  spentWei: string;
  spentEth: string;
  bestTier: string;
}

const TIER_NAMES = ['Common', 'Rare', 'Epic', 'Legendary'];

/**
 * Who has collected what, folded out of the indexed mint events.
 *
 * Two leaderboards, one source: the donations board sums money sent to the jar,
 * this one sums what people minted. Both are recomputable by anyone from the
 * chain — which is the whole reason the events exist.
 */
export const getCollectors = async (limit = 10): Promise<ICollectorEntry[]> => {
  const [claims, mints] = await Promise.all([
    readEvents(env.web3.nftContract, 'Claimed'),
    readEvents(env.web3.artifacts, 'Minted'),
  ]);

  const totals = new Map<
    string,
    {passes: number; artifacts: number; spent: bigint; bestTier: number}
  >();

  const entry = (address: string) =>
    totals.get(address) ?? {passes: 0, artifacts: 0, spent: 0n, bestTier: -1};

  for (const {args} of claims) {
    const key = (args.minter ?? '').toLowerCase();
    const current = entry(key);

    totals.set(key, {...current, passes: current.passes + 1});
  }

  for (const {args} of mints) {
    const key = (args.minter ?? '').toLowerCase();
    const current = entry(key);
    const tier = Number(args.tier ?? 0);

    totals.set(key, {
      ...current,
      artifacts: current.artifacts + 1,
      spent: current.spent + BigInt(args.price ?? '0'),
      bestTier: Math.max(current.bestTier, tier),
    });
  }

  return [...totals.entries()]
    .map(([address, value]) => ({address, ...value, tokens: value.passes + value.artifacts}))
    // Ranked by what they spent, then by how many they hold: a Legendary buyer
    // outranks someone who minted ten Commons, which is what the prices mean.
    .sort((a, b) => (b.spent === a.spent ? b.tokens - a.tokens : b.spent > a.spent ? 1 : -1))
    .slice(0, limit)
    .map((value, index) => ({
      rank: index + 1,
      address: getAddress(value.address),
      tokens: value.tokens,
      passes: value.passes,
      artifacts: value.artifacts,
      spentWei: value.spent.toString(),
      spentEth: formatEther(value.spent),
      bestTier: TIER_NAMES[value.bestTier] ?? '',
    }));
};
