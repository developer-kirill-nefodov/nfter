import {Sequelize} from 'sequelize';
import {createClient} from 'redis';

import {dbConfig, env} from '../config';
import {logger} from '../lib/logger';

export const db = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  port: dbConfig.PORT,
  dialect: dbConfig.dialect,
  pool: dbConfig.pool,
  logging: (sql) => logger.debug({sql}, 'sequelize'),
});

export const redis = createClient({
  socket: {
    host: env.redis.host,
    port: env.redis.port,
  },
  password: env.redis.password || undefined,
});

redis.on('error', (err: unknown) => logger.error({err}, 'redis error'));
redis.on('reconnecting', () => logger.warn('redis reconnecting'));
