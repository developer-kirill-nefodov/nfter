import {Contract, formatEther, getAddress} from 'ethers';

import {env} from '../config';
import {redis} from '../db';
import {logger} from '../lib/logger';

import {provider} from './provider';

export const TIP_JAR_ABI = [
  'function tip(string message) payable',
  'function owner() view returns (address)',
  'function balance() view returns (uint256)',
  'function totalTips() view returns (uint256)',
  'function tipCount() view returns (uint256)',
  'event Tipped(address indexed from, uint256 amount, string message, uint256 timestamp)',
];

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
  /** False until the jar exists at the configured address on this chain. */
  deployed: boolean;
}

interface ITipJar {
  owner(): Promise<string>;
  totalTips(): Promise<bigint>;
  tipCount(): Promise<bigint>;
  filters: {Tipped: () => unknown};
  queryFilter(filter: unknown, from: number, to: number | string): Promise<ITippedLog[]>;
}

interface ITippedLog {
  args: {from: string; amount: bigint; message: string; timestamp: bigint};
  transactionHash: string;
  blockNumber: number;
}

const contract = new Contract(env.web3.tipJar, TIP_JAR_ABI, provider) as unknown as ITipJar;

const CACHE_KEY = `tips:${env.web3.chainId}:${env.web3.tipJar.toLowerCase()}`;
const CACHE_TTL_SEC = 120;
const FEED_SIZE = 20;

/**
 * Reads the feed straight from the contract's event log.
 *
 * This is the payoff for routing tips through a contract rather than sending ETH
 * wallet-to-wallet: the history is a `queryFilter` away. No block-explorer API
 * key, no third-party indexer, nothing to go down but the RPC node itself.
 */
const readFeed = async (): Promise<ITipFeed> => {
  const [owner, totalTips, tipCount, head] = await Promise.all([
    contract.owner(),
    contract.totalTips(),
    contract.tipCount(),
    provider.getBlockNumber(),
  ]);

  const logs = await contract.queryFilter(contract.filters.Tipped(), env.web3.fromBlock, head);

  const tips = logs
    .slice(-FEED_SIZE)
    .reverse()
    .map((log) => ({
      from: getAddress(log.args.from),
      amount: log.args.amount.toString(),
      amountEth: formatEther(log.args.amount),
      message: log.args.message,
      timestamp: Number(log.args.timestamp),
      txHash: log.transactionHash,
      blockNumber: log.blockNumber,
    }));

  return {
    contract: env.web3.tipJar,
    owner: getAddress(owner),
    chainId: env.web3.chainId,
    totalTips: totalTips.toString(),
    totalTipsEth: formatEther(totalTips),
    tipCount: Number(tipCount),
    tips,
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

/**
 * The feed is cached because a log query is the single most expensive thing this
 * API asks of an RPC node, and the page it feeds re-renders constantly. A stale
 * tip list for two minutes costs nobody anything; a rate-limited RPC node costs
 * everybody the whole feature.
 */
export const getTipFeed = async ({refresh = false} = {}): Promise<ITipFeed> => {
  if (!refresh) {
    const cached = await redis.get(CACHE_KEY);

    if (cached) {
      return JSON.parse(cached) as ITipFeed;
    }
  }

  // A jar that is not deployed yet is a configuration state, not an outage: the
  // page says "no tips yet" instead of the whole API answering 500.
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

/** Called by the indexer worker after a tip lands, so the next reader sees it. */
export const refreshTipFeed = async (): Promise<ITipFeed> => {
  const feed = await getTipFeed({refresh: true});

  logger.debug({tips: feed.tipCount}, 'tip feed refreshed');

  return feed;
};
