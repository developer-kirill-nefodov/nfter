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

/**
 * Public RPC nodes cap `eth_getLogs` at a few dozen blocks — publicnode answers
 * "archive requests require a personal token" for anything older, and 1rpc caps
 * the range at 50. So the indexer never asks for more than it is allowed to.
 */
const WINDOW = 40;

/** How far back a first run reaches. Beyond this the node will refuse anyway. */
const MAX_BACKFILL = 5_000;

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
    // Everything is stored as a string: a uint256 does not survive JSON, and a
    // wei amount that silently loses precision is worse than no feed at all.
    args[input.name] = String(parsed.args[index]);
  });

  return args;
};

const syncSource = async (source: ISource, head: number): Promise<number> => {
  const contract = new Contract(source.address, source.abi, provider);

  const [state] = await IndexerStateModel.findOrCreate({
    where: {contract: source.address},
    defaults: {
      contract: source.address,
      last_block: Math.max(env.web3.fromBlock - 1, head - MAX_BACKFILL),
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

      // The unique (tx_hash, log_index) index makes this idempotent: a re-scan
      // after a restart, or across a reorg, cannot double-count anything.
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

/** Advances every source to the current head. Safe to run concurrently with reads. */
export const syncChainEvents = async (): Promise<number> => {
  const head = await provider.getBlockNumber();

  let written = 0;

  for (const source of SOURCES) {
    try {
      written += await syncSource(source, head);
    } catch (err) {
      // One flaky source must not stall the others, and the cursor only advances
      // on success — the next tick simply picks up where this one gave up.
      logger.warn({err, contract: source.address}, 'indexer source failed');
    }
  }

  if (written > 0) {
    logger.info({written, head}, 'indexed new chain events');
  }

  return written;
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
