import {randomUUID} from 'crypto';
import jwt, {type JwtPayload, type SignOptions} from 'jsonwebtoken';

import {env} from '../../config';
import {redis} from '../../db';
import type {IRole} from '../../interfaces/models/user';

export type ITokenType = 'access' | 'refresh';

export interface IUserData {
  id: number;
  email: string | null;
  role: IRole;
  walletAddress: string | null;
}

/** A user's identity plus the session (device) the tokens were minted for. */
export interface ISession extends IUserData {
  sid: string;
}

export interface ITokens {
  accessToken: string;
  refreshToken: string;
  sid: string;
}

interface ITokenPayload extends JwtPayload {
  data: IUserData;
  sid: string;
}

const SECRETS: Record<ITokenType, string> = {
  access: env.jwt.accessSecret,
  refresh: env.jwt.refreshSecret,
};

const TTL_SEC: Record<ITokenType, number> = {
  access: env.jwt.accessTtlSec,
  refresh: env.jwt.refreshTtlSec,
};

/**
 * One Redis key per (user, session, token type). Keying by session id rather
 * than by email is what lets a user stay logged in on several devices at once —
 * and what lets logout revoke exactly one of them.
 */
const sessionKey = (type: ITokenType, userId: number, sid: string) =>
  `session:${type}:${userId}:${sid}`;

const sign = (type: ITokenType, data: IUserData, sid: string): string => {
  const options: SignOptions = {
    algorithm: 'HS256',
    expiresIn: TTL_SEC[type],
    subject: String(data.id),
    jwtid: sid,
  };

  return jwt.sign({data, sid}, SECRETS[type], options);
};

export const createTokens = async (data: IUserData): Promise<ITokens> => {
  const sid = randomUUID();

  const accessToken = sign('access', data, sid);
  const refreshToken = sign('refresh', data, sid);

  await Promise.all([
    redis.setEx(sessionKey('access', data.id, sid), TTL_SEC.access, accessToken),
    redis.setEx(sessionKey('refresh', data.id, sid), TTL_SEC.refresh, refreshToken),
  ]);

  return {accessToken, refreshToken, sid};
};

/**
 * A token is valid only if it verifies cryptographically AND is still the token
 * we handed out for that session. The Redis half is what makes logout and
 * refresh-rotation actually revoke a token, instead of merely forgetting it.
 */
export const getValidSession = async (
  token: string | undefined,
  type: ITokenType,
): Promise<ISession | null> => {
  if (!token) {
    return null;
  }

  let payload: ITokenPayload;

  try {
    payload = jwt.verify(token, SECRETS[type], {algorithms: ['HS256']}) as ITokenPayload;
  } catch {
    return null;
  }

  if (!payload?.data?.id || !payload.sid) {
    return null;
  }

  const stored = await redis.get(sessionKey(type, payload.data.id, payload.sid));

  if (stored !== token) {
    return null;
  }

  return {...payload.data, sid: payload.sid};
};

export const revokeSession = async (userId: number, sid: string): Promise<void> => {
  await redis.del([sessionKey('access', userId, sid), sessionKey('refresh', userId, sid)]);
};

/** Used when a password changes: every device must be signed out. */
export const revokeAllSessions = async (userId: number): Promise<void> => {
  const keys: string[] = [];

  for await (const key of redis.scanIterator({MATCH: `session:*:${userId}:*`, COUNT: 100})) {
    keys.push(...(Array.isArray(key) ? key : [key]));
  }

  if (keys.length) {
    await redis.del(keys);
  }
};
