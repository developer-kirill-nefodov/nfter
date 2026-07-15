import {Contract, formatEther, getAddress} from 'ethers';

import {env} from '../config';
import {redis} from '../db';
import {logger} from '../lib/logger';

import {rankCollectors} from './collectors';
import type {ICollectorEntry} from './collectors';
import {ERC721_ABI} from './erc721.abi';
import {readEvents} from './indexer.service';

export type {ICollectorEntry};
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
  artifactsContract: string;
  passesMinted: number;
  artifactsMinted: number;
  holders: number;
  tipsTotalEth: string;
  tipCount: number;
  showcase: IShowcaseItem[];
  artifactShowcase: IShowcaseItem[];
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

const artifacts = new Contract(
  env.web3.artifacts,
  ['function tokenURI(uint256) view returns (string)'],
  provider,
) as unknown as {tokenURI(tokenId: string): Promise<string>};

const TIER_NAMES = ['Common', 'Rare', 'Epic', 'Legendary'];
const ZERO = '0x0000000000000000000000000000000000000000';

const CACHE_KEY = `stats:${env.web3.chainId}:${env.web3.nftContract.toLowerCase()}`;
const CACHE_TTL_SEC = 60;
const SHOWCASE_SIZE = 8;

const decodeMetadata = (uri: string): {name: string; image: string} => {
  const payload = uri.slice(uri.indexOf(',') + 1);
  const json = JSON.parse(Buffer.from(payload, 'base64').toString('utf8')) as {
    name: string;
    image: string;
  };

  return {name: json.name, image: json.image};
};

const readStats = async (): Promise<IPublicStats> => {
  const [totalSupply, tips, claims, mints] = await Promise.all([
    pass.totalSupply(),
    getTipFeed(),
    readEvents(env.web3.nftContract, 'Claimed'),
    readEvents(env.web3.artifacts, 'Minted'),
  ]);

  const recent = claims.slice(-SHOWCASE_SIZE).reverse();

  // Each showcase item is an independent chain read. One nonexistent/failing token must not throw
  // and blank the entire public stats page — drop the item that failed and keep the rest.
  const settle = async <T>(items: Promise<T>[]): Promise<T[]> =>
    (await Promise.allSettled(items))
      .filter((r): r is PromiseFulfilledResult<Awaited<T>> => r.status === 'fulfilled')
      .map((r) => r.value);

  const showcase = await settle(
    recent.map(async ({args}) => {
      const tokenId = args.tokenId ?? '0';

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

  const artifactShowcase = await settle(
    mints
      .slice(-SHOWCASE_SIZE)
      .reverse()
      .map(async ({args}) => {
        const tokenId = args.tokenId ?? '0';
        const {name, image} = decodeMetadata(await artifacts.tokenURI(tokenId));

        return {
          tokenId,
          minter: getAddress(args.minter ?? ZERO),
          name,
          image,
          rarity: TIER_NAMES[Number(args.tier ?? 0)] ?? '',
        };
      }),
  );

  const holders = new Set(
    [...claims, ...mints].map(({args}) => (args.minter ?? '').toLowerCase()),
  ).size;

  logger.debug({passes: Number(totalSupply)}, 'stats read');

  return {
    chainId: env.web3.chainId,
    passContract: env.web3.nftContract,
    tipJarContract: env.web3.tipJar,
    artifactsContract: env.web3.artifacts,
    passesMinted: Number(totalSupply),
    artifactsMinted: mints.length,
    holders,
    tipsTotalEth: tips.totalTipsEth,
    tipCount: tips.tipCount,
    showcase,
    artifactShowcase,
    deployed: true,
  };
};

const emptyStats = (): IPublicStats => ({
  chainId: env.web3.chainId,
  passContract: env.web3.nftContract,
  tipJarContract: env.web3.tipJar,
  artifactsContract: env.web3.artifacts,
  passesMinted: 0,
  artifactsMinted: 0,
  holders: 0,
  tipsTotalEth: '0.0',
  tipCount: 0,
  showcase: [],
  artifactShowcase: [],
  deployed: false,
});

// `readStats` fans out a tokenURI/rarityOf read per showcase item, and the endpoint is public with
// a `?refresh=true` bypass. Collapse concurrent refreshes into one execution and rate-limit the
// heavy read, so a flood of forced refreshes cannot exhaust the RPC or evict the shared cache.
const REFRESH_COOLDOWN_SEC = 3;

let refreshInFlight: Promise<IPublicStats> | null = null;

const doRefresh = async (cached: string | null): Promise<IPublicStats> => {
  try {
    const stats = await readStats();

    await redis.setEx(CACHE_KEY, CACHE_TTL_SEC, JSON.stringify(stats));

    return stats;
  } catch (err) {
    // Don't cache zeros over a transient RPC failure — that shows "deployed: false" to everyone for
    // a full minute. Serve the last good stats if we have them, and leave the cache intact.
    logger.warn({err}, 'stats unreadable');

    return cached ? (JSON.parse(cached) as IPublicStats) : emptyStats();
  }
};

export const getPublicStats = async ({refresh = false} = {}): Promise<IPublicStats> => {
  const cached = await redis.get(CACHE_KEY);

  if (!refresh && cached) {
    return JSON.parse(cached) as IPublicStats;
  }

  if (refresh && cached && (await redis.get(`${CACHE_KEY}:refreshed`))) {
    return JSON.parse(cached) as IPublicStats;
  }

  if (!refreshInFlight) {
    refreshInFlight = doRefresh(cached).finally(() => {
      refreshInFlight = null;
    });

    if (refresh) {
      void redis
        .setEx(`${CACHE_KEY}:refreshed`, REFRESH_COOLDOWN_SEC, '1')
        .catch((err: unknown) => logger.warn({err}, 'could not set stats refresh cooldown'));
    }
  }

  return refreshInFlight;
};

export const formatEth = formatEther;

export const getCollectors = async (limit = 20): Promise<ICollectorEntry[]> => {
  const [claims, mints, sales] = await Promise.all([
    readEvents(env.web3.nftContract, 'Claimed'),
    readEvents(env.web3.artifacts, 'Minted'),
    readEvents(env.web3.marketplace, 'Sold'),
  ]);

  // Rank by the rarity points of what each address currently holds — mint attribution re-pointed by
  // every marketplace sale — so buying or selling actually moves the board once the sale is indexed.
  return rankCollectors(claims, mints, sales, {
    passContract: env.web3.nftContract,
    artifactsContract: env.web3.artifacts,
    limit,
  });
};

export type IActivityKind = 'artifact' | 'pass' | 'tip';

export interface IActivityItem {
  kind: IActivityKind;
  actor: string;
  tokenId?: string;
  tier?: string;
  priceEth?: string;
  amountEth?: string;
  message?: string;
  txHash: string;
  blockNumber: number;
}

export const getActivity = async (limit = 30): Promise<IActivityItem[]> => {
  const [claims, mints, tips] = await Promise.all([
    readEvents(env.web3.nftContract, 'Claimed'),
    readEvents(env.web3.artifacts, 'Minted'),
    readEvents(env.web3.tipJar, 'Tipped'),
  ]);

  const items: IActivityItem[] = [
    ...mints.map(({args, txHash, blockNumber}) => ({
      kind: 'artifact' as const,
      actor: getAddress(args.minter ?? ZERO),
      tokenId: args.tokenId,
      tier: TIER_NAMES[Number(args.tier ?? 0)],
      priceEth: formatEther(args.price ?? '0'),
      txHash,
      blockNumber,
    })),
    ...claims.map(({args, txHash, blockNumber}) => ({
      kind: 'pass' as const,
      actor: getAddress(args.minter ?? ZERO),
      tokenId: args.tokenId,
      txHash,
      blockNumber,
    })),
    ...tips.map(({args, txHash, blockNumber}) => ({
      kind: 'tip' as const,
      actor: getAddress(args.from ?? ZERO),
      amountEth: formatEther(args.amount ?? '0'),
      message: args.message,
      txHash,
      blockNumber,
    })),
  ];

  return items.sort((a, b) => b.blockNumber - a.blockNumber).slice(0, limit);
};
