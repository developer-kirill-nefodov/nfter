import {Queue, Worker} from 'bullmq';

import {logger} from '../lib/logger';
import {syncChainEvents} from '../web3/indexer.service';
import {getPublicStats} from '../web3/stats.service';
import {refreshTipFeed} from '../web3/tip.service';

import {queueConnection} from './email.queue';

const QUEUE_NAME = 'chain-indexer';

export const tipIndexerQueue = new Queue(QUEUE_NAME, {
  connection: queueConnection,
  defaultJobOptions: {removeOnComplete: 20, removeOnFail: 50},
});

export const tipIndexerWorker = new Worker(
  QUEUE_NAME,
  async () => {
    await syncChainEvents();
    await refreshTipFeed();
    await getPublicStats({refresh: true});
  },
  {connection: queueConnection, concurrency: 1},
);

tipIndexerWorker.on('failed', (_job, err) => {
  logger.warn({err}, 'tip indexer run failed');
});

export const startTipIndexer = async (): Promise<void> => {
  await tipIndexerQueue.upsertJobScheduler(
    'refresh-tip-feed',
    {every: 30_000},
    {name: 'refresh-tip-feed'},
  );

  logger.info('chain indexer scheduled every 30s');
};
