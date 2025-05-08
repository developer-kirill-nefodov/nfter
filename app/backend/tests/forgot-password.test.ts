import {beforeEach, describe, expect, it, vi} from 'vitest';

import {createRedisMock} from './redis-mock';

const redis = createRedisMock();
const emailJobs: {email: string; resetUrl: string}[] = [];

vi.mock('../src/db', () => ({redis, db: {}}));
vi.mock('../src/workers/email.queue', () => ({
  addEmailJob: vi.fn(async (job: {email: string; resetUrl: string}) => void emailJobs.push(job)),
}));

const {createResetToken, consumeResetToken} = await import(
  '../src/services/auth/forgot-password.service'
);

const EMAIL = 'user@ethers-web3.dev';

const tokenFrom = (resetUrl: string) => new URL(resetUrl).searchParams.get('token') ?? '';

describe('password reset', () => {
  beforeEach(() => {
    redis.store.clear();
    emailJobs.length = 0;
  });

  it('emails a link that redeems to the right user', async () => {
    await createResetToken(7, EMAIL);

    expect(emailJobs).toHaveLength(1);
    await expect(consumeResetToken(tokenFrom(emailJobs[0]!.resetUrl))).resolves.toBe(7);
  });

  it('burns the token, so a link cannot be reused', async () => {
    await createResetToken(7, EMAIL);

    const token = tokenFrom(emailJobs[0]!.resetUrl);

    await consumeResetToken(token);

    await expect(consumeResetToken(token)).resolves.toBeNull();
  });

  it('stores only a hash, so a Redis dump does not hand over live links', async () => {
    await createResetToken(7, EMAIL);

    const token = tokenFrom(emailJobs[0]!.resetUrl);
    const keys = [...redis.store.keys()];

    expect(keys.some((key) => key.includes(token))).toBe(false);
  });

  it('refuses to send a second link to the same mailbox during the cooldown', async () => {
    await createResetToken(7, EMAIL);
    await createResetToken(7, EMAIL);
    await createResetToken(7, EMAIL);

    expect(emailJobs).toHaveLength(1);
  });

  it('lets a different mailbox through immediately', async () => {
    await createResetToken(7, EMAIL);
    await createResetToken(8, 'someone-else@ethers-web3.dev');

    expect(emailJobs).toHaveLength(2);
  });

  it('sends again once the cooldown has expired', async () => {
    await createResetToken(7, EMAIL);

    for (const key of [...redis.store.keys()].filter((k) => k.startsWith('reset-cooldown:'))) {
      redis.store.delete(key);
    }

    await createResetToken(7, EMAIL);

    expect(emailJobs).toHaveLength(2);
  });

  it('rejects a token nobody ever issued', async () => {
    await expect(consumeResetToken('made-up')).resolves.toBeNull();
  });
});
