import {createApp} from './app';
import {env} from './config';
import {db, redis} from './db';
import {logger} from './lib/logger';
import {emailWorker} from './workers/email.worker';
import {startTipIndexer, tipIndexerWorker} from './workers/tip-indexer.worker';

const start = async () => {
  // A server that boots without its database only turns every request into a
  // 500, so a failed connection is fatal here rather than a logged warning.
  await redis.connect();
  logger.info('redis connected');

  await db.authenticate();
  logger.info('postgres connected');

  await startTipIndexer();

  const server = createApp().listen(env.port, () => {
    logger.info(`server listening on http://localhost:${env.port}`);
  });

  const shutdown = async (signal: string) => {
    logger.info({signal}, 'shutting down');

    server.close();

    await Promise.allSettled([
      emailWorker.close(),
      tipIndexerWorker.close(),
      redis.quit(),
      db.close(),
    ]);

    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
};

start().catch((err: unknown) => {
  logger.fatal({err}, 'server failed to start');
  process.exit(1);
});
