import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, {type Express} from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import {env} from './config';
import {logger} from './lib/logger';
import {errorHandler, notFoundHandler} from './middlewares/error';
import {routers} from './routers';

export const createApp = (): Express => {
  const app = express();

  app.set('trust proxy', 1);

  app.set('etag', false);
  app.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  app.use(helmet());
  app.use(cors({origin: env.frontendUrl, credentials: true}));
  app.use(express.json({limit: '100kb'}));
  app.use(cookieParser());
  app.use(pinoHttp({logger}));

  app.get('/api/health', (_req, res) => {
    res.status(200).json({status: 'ok'});
  });

  app.use('/api', routers());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
