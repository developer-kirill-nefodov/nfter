import rateLimit, {type Options} from 'express-rate-limit';

import {AppError} from '../errors/app-error';

const base: Partial<Options> = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: () => {
    throw AppError.tooManyRequests('Too many attempts — please try again later');
  },
};

export const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
});

export const forgotPasswordLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 5,
});

export const apiLimiter = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  limit: 100,
});
