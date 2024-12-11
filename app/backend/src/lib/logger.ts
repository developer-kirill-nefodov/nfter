import pino from 'pino';

import {env} from '../config';

export const logger = pino({
  level: env.logLevel,
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password', '*.password'],
    censor: '[redacted]',
  },
  ...(env.isProduction ? {} : {transport: {target: 'pino-pretty', options: {colorize: true}}}),
});
