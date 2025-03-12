import {Queue, Worker} from 'bullmq';

import {logger} from '../lib/logger';
import {refreshTipFeed} from '../web3/tip.service';

import {queueConnection} from './email.queue';

const QUEUE_NAME = 'tip-indexer';

export const tipIndexerQueue = new Queue(QUEUE_NAME, {
  connection: queueConnection,
  defaultJobOptions: {removeOnComplete: 20, removeOnFail: 50},
});

/**
 * Keeps the tip feed warm in the background.
 *
 * Without this, the first visitor after the cache expires pays for the log query
 * — a slow, rate-limited call — and stares at a spinner while an RPC node thinks.
 * A repeatable job means the cache is refilled before anyone asks, and a request
 * is only ever answered from Redis.
 *
 * The schedule lives in BullMQ rather than in a setInterval so that it survives a
 * restart and does not multiply when the API is scaled to more than one process.
 */
export const tipIndexerWorker = new Worker(
  QUEUE_NAME,
  async () => {
    await refreshTipFeed();
  },
  {connection: queueConnection, concurrency: 1},
);

tipIndexerWorker.on('failed', (_job, err) => {
  // An RPC hiccup is not fatal: the cached feed stays servable and the next tick
  // tries again.
  logger.warn({err}, 'tip indexer run failed');
});

export const startTipIndexer = async (): Promise<void> => {
  await tipIndexerQueue.upsertJobScheduler(
    'refresh-tip-feed',
    {every: 60_000},
    {name: 'refresh-tip-feed'},
  );

  logger.info('tip indexer scheduled every 60s');
};
