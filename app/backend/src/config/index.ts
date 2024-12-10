import type {Dialect} from 'sequelize';

import {env} from './env';

export {env};

export const dbConfig = {
  HOST: env.db.host,
  PORT: env.db.port,
  USER: env.db.username,
  PASSWORD: env.db.password,
  DB: env.db.name,
  dialect: 'postgres' as Dialect,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};
