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

// For login, only failed attempts should count (`skipSuccessfulRequests`), so a busy legitimate user
// is never locked out. But endpoints whose *successful* calls are the abuse — account creation
// (spam/referral farming) and nonce issuance (unbounded Redis keys) — must count successes too.
export const createLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 20,
});

export const nonceLimiter = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  limit: 30,
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
