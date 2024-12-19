import rateLimit, {type Options} from 'express-rate-limit';

import {AppError} from '../errors/app-error';

const base: Partial<Options> = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: () => {
    throw AppError.tooManyRequests('Too many attempts — please try again later');
  },
};

/** Credential endpoints: the only real defence against online brute force. */
export const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
});

/** Sending mail costs money and can be used to spam a third party's inbox. */
export const forgotPasswordLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 5,
});

/** Every NFT read that misses the cache costs an RPC call. */
export const apiLimiter = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  limit: 100,
});
