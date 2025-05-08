import {Contract, formatEther, getAddress} from 'ethers';

import {env} from '../config';
import {redis} from '../db';
import {logger} from '../lib/logger';

import {TIP_JAR_ABI} from './abis';
import {readEvents} from './indexer.service';
import {provider} from './provider';

export interface ITip {
  from: string;
  amount: string;
  amountEth: string;
  message: string;
  timestamp: number;
  txHash: string;
  blockNumber: number;
}

export interface ITipFeed {
  contract: string;
  owner: string;
  chainId: number;
  totalTips: string;
  totalTipsEth: string;
  tipCount: number;
  tips: ITip[];
  deployed: boolean;
}

export interface ILeaderboardEntry {
  rank: number;
  address: string;
  totalWei: string;
  totalEth: string;
  tips: number;
  lastMessage: string;
}

interface ITipJar {
  owner(): Promise<string>;
  totalTips(): Promise<bigint>;
  tipCount(): Promise<bigint>;
}

const contract = new Contract(env.web3.tipJar, TIP_JAR_ABI, provider) as unknown as ITipJar;

const CACHE_KEY = `tips:${env.web3.chainId}:${env.web3.tipJar.toLowerCase()}`;
const CACHE_TTL_SEC = 30;
const FEED_SIZE = 20;

const allTips = async (): Promise<ITip[]> => {
  const events = await readEvents(env.web3.tipJar, 'Tipped');

  return events.map(({args, txHash, blockNumber}) => {
    const amount = args.amount ?? '0';

    return {
      from: getAddress(args.from ?? '0x0000000000000000000000000000000000000000'),
      amount,
      amountEth: formatEther(amount),
      message: args.message ?? '',
      timestamp: Number(args.timestamp ?? 0),
      txHash,
      blockNumber,
    };
  });
};

const readFeed = async (): Promise<ITipFeed> => {
  const [owner, totalTips, tipCount, tips] = await Promise.all([
    contract.owner(),
    contract.totalTips(),
    contract.tipCount(),
    allTips(),
  ]);

  return {
    contract: env.web3.tipJar,
    owner: getAddress(owner),
    chainId: env.web3.chainId,
    totalTips: totalTips.toString(),
    totalTipsEth: formatEther(totalTips),
    tipCount: Number(tipCount),
    tips: tips.slice(-FEED_SIZE).reverse(),
    deployed: true,
  };
};

const emptyFeed = (): ITipFeed => ({
  contract: env.web3.tipJar,
  owner: '',
  chainId: env.web3.chainId,
  totalTips: '0',
  totalTipsEth: '0.0',
  tipCount: 0,
  tips: [],
  deployed: false,
});

export const getTipFeed = async ({refresh = false} = {}): Promise<ITipFeed> => {
  if (!refresh) {
    const cached = await redis.get(CACHE_KEY);

    if (cached) {
      return JSON.parse(cached) as ITipFeed;
    }
  }

  let feed: ITipFeed;

  try {
    feed = await readFeed();
  } catch (err) {
    logger.warn({err, contract: env.web3.tipJar}, 'tip jar unreachable — serving an empty feed');
    feed = emptyFeed();
  }

  await redis.setEx(CACHE_KEY, CACHE_TTL_SEC, JSON.stringify(feed));

  return feed;
};

export const refreshTipFeed = async (): Promise<ITipFeed> => {
  const feed = await getTipFeed({refresh: true});

  logger.debug({tips: feed.tipCount}, 'tip feed refreshed');

  return feed;
};

export const getLeaderboard = async (limit = 20): Promise<ILeaderboardEntry[]> => {
  const tips = await allTips();

  const totals = new Map<string, {wei: bigint; tips: number; lastMessage: string}>();

  for (const tip of tips) {
    const key = tip.from.toLowerCase();
    const current = totals.get(key) ?? {wei: 0n, tips: 0, lastMessage: ''};

    totals.set(key, {
      wei: current.wei + BigInt(tip.amount),
      tips: current.tips + 1,
      lastMessage: tip.message || current.lastMessage,
    });
  }

  return [...totals.entries()]
    .sort(([, a], [, b]) => (b.wei > a.wei ? 1 : b.wei < a.wei ? -1 : 0))
    .slice(0, limit)
    .map(([address, entry], index) => ({
      rank: index + 1,
      address: getAddress(address),
      totalWei: entry.wei.toString(),
      totalEth: formatEther(entry.wei),
      tips: entry.tips,
      lastMessage: entry.lastMessage,
    }));
};
