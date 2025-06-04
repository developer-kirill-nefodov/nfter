import {beforeEach, describe, expect, it, vi} from 'vitest';

import {createRedisMock} from './redis-mock';

const redis = createRedisMock();

vi.mock('../src/db', () => ({redis, db: {}}));

const {createTokens, getValidSession, retireSession, revokeSession, revokeAllSessions} =
  await import('../src/helpers/token/token');

const USER = {
  id: 42,
  email: 'user@ethers-web3.dev',
  role: {name: 'USER' as const, permissions: {}},
  walletAddress: null,
};

describe('session tokens', () => {
  beforeEach(() => {
    redis.store.clear();
  });

  it('issues an access/refresh pair bound to one session id', async () => {
    const tokens = await createTokens(USER);

    expect(redis.store.get(`session:access:42:${tokens.sid}`)).toBe(tokens.accessToken);
    expect(redis.store.get(`session:refresh:42:${tokens.sid}`)).toBe(tokens.refreshToken);
  });

  it('accepts a token that is both signed by us and still the one we handed out', async () => {
    const {accessToken, sid} = await createTokens(USER);

    await expect(getValidSession(accessToken, 'access')).resolves.toMatchObject({id: 42, sid});
  });

  it('rejects an access token presented as a refresh token', async () => {
    const {accessToken} = await createTokens(USER);

    await expect(getValidSession(accessToken, 'refresh')).resolves.toBeNull();
  });

  it('rejects a well-formed token that Redis no longer knows about', async () => {
    const {accessToken, sid} = await createTokens(USER);

    redis.store.delete(`session:access:42:${sid}`);

    await expect(getValidSession(accessToken, 'access')).resolves.toBeNull();
  });

  it('revokes exactly the session that logged out, leaving other devices signed in', async () => {
    const phone = await createTokens(USER);
    const laptop = await createTokens(USER);

    await revokeSession(USER.id, phone.sid);

    await expect(getValidSession(phone.accessToken, 'access')).resolves.toBeNull();
    await expect(getValidSession(laptop.accessToken, 'access')).resolves.not.toBeNull();
  });

  it('revokes every device when the password changes', async () => {
    const phone = await createTokens(USER);
    const laptop = await createTokens(USER);

    await revokeAllSessions(USER.id);

    await expect(getValidSession(phone.refreshToken, 'refresh')).resolves.toBeNull();
    await expect(getValidSession(laptop.refreshToken, 'refresh')).resolves.toBeNull();
  });

  it('ignores garbage', async () => {
    await expect(getValidSession(undefined, 'access')).resolves.toBeNull();
    await expect(getValidSession('not-a-jwt', 'access')).resolves.toBeNull();
  });
});

describe('rotation', () => {
  beforeEach(() => {
    redis.store.clear();
  });

  it('keeps the old refresh token usable for a moment after rotating it', async () => {
    const first = await createTokens(USER);

    await retireSession(USER.id, first.sid);

    expect(await getValidSession(first.refreshToken, 'refresh')).not.toBeNull();
    expect(await getValidSession(first.accessToken, 'access')).toBeNull();
  });

  it('still lets a session be revoked outright', async () => {
    const tokens = await createTokens(USER);

    await revokeSession(USER.id, tokens.sid);

    expect(await getValidSession(tokens.refreshToken, 'refresh')).toBeNull();
  });
});
