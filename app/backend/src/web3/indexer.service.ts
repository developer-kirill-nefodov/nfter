import {Contract, type Log} from 'ethers';

import {env} from '../config';
import {logger} from '../lib/logger';
import {ChainEventModel, IndexerStateModel} from '../models/chain-event.model';

import {provider} from './provider';
import {
  ARTIFACT_EVENTS_ABI,
  MARKETPLACE_ABI,
  PASS_EVENTS_ABI,
  REFERRALS_ABI,
  TIP_JAR_ABI,
} from './abis';

const WINDOW = 40;

interface ISource {
  address: string;
  abi: string[];
  events: string[];
}

const SOURCES: ISource[] = [
  {address: env.web3.nftContract, abi: PASS_EVENTS_ABI, events: ['Claimed']},
  {address: env.web3.tipJar, abi: TIP_JAR_ABI, events: ['Tipped']},
  {address: env.web3.artifacts, abi: ARTIFACT_EVENTS_ABI, events: ['Minted']},
  {
    address: env.web3.marketplace,
    abi: MARKETPLACE_ABI,
    events: ['Listed', 'Sold', 'Cancelled'],
  },
  {address: env.web3.referrals, abi: REFERRALS_ABI, events: ['Referred', 'Credited']},
];

const serialiseArgs = (log: Log, contract: Contract): Record<string, string> | null => {
  const parsed = contract.interface.parseLog({topics: [...log.topics], data: log.data});

  if (!parsed) {
    return null;
  }

  const args: Record<string, string> = {event: parsed.name};

  parsed.fragment.inputs.forEach((input, index) => {
    args[input.name] = String(parsed.args[index]);
  });

  return args;
};

const syncSource = async (source: ISource, head: number): Promise<number> => {
  const contract = new Contract(source.address, source.abi, provider);

  const [state] = await IndexerStateModel.findOrCreate({
    where: {contract: source.address},
    defaults: {
      // Always start at the deployment block. A `head - MAX_BACKFILL` floor silently skips every
      // event between deployment and the first run if that gap exceeds the window — leaderboards,
      // treasury and stats would undercount permanently, and nothing would ever go back for them.
      contract: source.address,
      last_block: env.web3.fromBlock - 1,
    },
  });

  let from = state.last_block + 1;
  let written = 0;

  while (from <= head) {
    const to = Math.min(from + WINDOW - 1, head);

    const logs = await provider.getLogs({address: source.address, fromBlock: from, toBlock: to});

    for (const log of logs) {
      const args = serialiseArgs(log, contract);

      if (!args || !source.events.includes(args.event ?? '')) {
        continue;
      }

      const [, created] = await ChainEventModel.findOrCreate({
        where: {tx_hash: log.transactionHash, log_index: log.index},
        defaults: {
          contract: source.address,
          event: args.event!,
          block_number: log.blockNumber,
          tx_hash: log.transactionHash,
          log_index: log.index,
          args,
        },
      });

      if (created) {
        written += 1;
      }
    }

    await state.update({last_block: to});

    from = to + 1;
  }

  return written;
};

/**
 * The tip of the chain can be reorganised away. Indexing a block at zero confirmations means a
 * reorg leaves a phantom event in the database forever (rows are keyed by tx hash + log index and
 * the cursor only moves forward, so the orphan is never revisited). Stay `confirmations` blocks
 * behind the head, where a reorg is vanishingly unlikely, and treat that as the frontier.
 */
const safeHead = async (): Promise<number> =>
  (await provider.getBlockNumber()) - env.web3.confirmations;

export const syncChainEvents = async (): Promise<number> => {
  const head = await safeHead();

  if (head < env.web3.fromBlock) {
    return 0;
  }

  let written = 0;

  for (const source of SOURCES) {
    try {
      written += await withoutOverlap(source.address, () => syncSource(source, head));
    } catch (err) {
      logger.warn({err, contract: source.address}, 'indexer source failed');
    }
  }

  if (written > 0) {
    logger.info({written, head}, 'indexed new chain events');
  }

  return written;
};

const inFlight = new Map<string, Promise<number>>();

// A read request and the scheduled worker can ask for the same contract at the same time. Writes are
// idempotent, but the block cursor is not: two walkers racing on it re-fetch the same logs and can
// move it backwards. One walk per contract, everyone else waits for its answer.
const withoutOverlap = async (address: string, run: () => Promise<number>): Promise<number> => {
  const key = address.toLowerCase();
  const running = inFlight.get(key);

  if (running) {
    return running;
  }

  const started = run().finally(() => inFlight.delete(key));

  inFlight.set(key, started);

  return started;
};

/**
 * Bring a single contract's events up to the current head, now, rather than waiting for the next
 * scheduled indexer run. A user who just sent a transaction is asking about *their* block: making
 * them wait 30s for a background job to notice it is what makes a confirmed listing look lost.
 */
export const syncContract = async (address: string): Promise<number> => {
  const source = SOURCES.find(
    ({address: candidate}) => candidate.toLowerCase() === address.toLowerCase(),
  );

  if (!source) {
    return 0;
  }

  try {
    const head = await safeHead();

    if (head < env.web3.fromBlock) {
      return 0;
    }

    return await withoutOverlap(source.address, () => syncSource(source, head));
  } catch (err) {
    logger.warn({err, contract: address}, 'on-demand sync failed');

    return 0;
  }
};

export const readEvents = async (contract: string, event: string) => {
  const rows = await ChainEventModel.findAll({
    where: {contract, event},
    order: [
      ['block_number', 'ASC'],
      ['log_index', 'ASC'],
    ],
  });

  return rows.map((row) => ({
    args: row.args,
    txHash: row.tx_hash,
    blockNumber: row.block_number,
  }));
};
