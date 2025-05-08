import type {CookieOptions} from 'express';

import {env} from '../config';

export const REFRESH_COOKIE_NAME = 'refreshToken';

export const REFRESH_COOKIE_PATH = '/api/auth';

export const REFRESH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.isProduction ? 'none' : 'lax',
  path: REFRESH_COOKIE_PATH,
  maxAge: env.jwt.refreshTtlSec * 1000,
};

export const LIFETIME_RESET_TOKEN_SEC = 15 * 60;

export const RESET_COOLDOWN_SEC = 30;
export const LIFETIME_NONCE_SEC = 5 * 60;
export const LIFETIME_NFT_CACHE_SEC = 5 * 60;
