import {Wallet} from 'ethers';
import {SiweMessage} from 'siwe';
import {beforeEach, describe, expect, it, vi} from 'vitest';

import {createRedisMock} from './redis-mock';

const redis = createRedisMock();

vi.mock('../src/db', () => ({redis, db: {}}));

const {issueNonce, verifySiweMessage} = await import('../src/web3/siwe.service');

const wallet = Wallet.createRandom();

const buildMessage = async (overrides: Partial<SiweMessage> = {}) =>
  new SiweMessage({
    domain: 'localhost:3000',
    address: wallet.address,
    statement: 'Sign in to ethers-web3',
    uri: 'http://localhost:3000',
    version: '1',
    chainId: 11155111,
    nonce: await issueNonce(),
    ...overrides,
  });

const sign = async (message: SiweMessage) => {
  const prepared = message.prepareMessage();
  return {message: prepared, signature: await wallet.signMessage(prepared)};
};

describe('Sign-In with Ethereum', () => {
  beforeEach(() => {
    redis.store.clear();
  });

  it('recovers the signing address from a valid message', async () => {
    const {message, signature} = await sign(await buildMessage());

    await expect(verifySiweMessage(message, signature)).resolves.toBe(
      wallet.address.toLowerCase(),
    );
  });

  it('refuses to redeem the same nonce twice', async () => {
    const {message, signature} = await sign(await buildMessage());

    await verifySiweMessage(message, signature);

    // The signature stays cryptographically valid forever, so single-use nonces
    // are the only thing standing between a captured message and a replay.
    await expect(verifySiweMessage(message, signature)).rejects.toThrow(/expired/i);
  });

  it('rejects a signature produced by a different wallet', async () => {
    const impostor = Wallet.createRandom();
    const prepared = (await buildMessage()).prepareMessage();
    const signature = await impostor.signMessage(prepared);

    await expect(verifySiweMessage(prepared, signature)).rejects.toThrow(/does not match/i);
  });

  it('rejects a message minted for another domain', async () => {
    const {message, signature} = await sign(await buildMessage({domain: 'evil.example'}));

    await expect(verifySiweMessage(message, signature)).rejects.toThrow(/different domain/i);
  });

  it('rejects a message signed on the wrong chain', async () => {
    const {message, signature} = await sign(await buildMessage({chainId: 1}));

    await expect(verifySiweMessage(message, signature)).rejects.toThrow(/network/i);
  });

  it('rejects a nonce that was never issued', async () => {
    const {message, signature} = await sign(
      await buildMessage({nonce: 'abcdefgh12345678abcdefgh'}),
    );

    await expect(verifySiweMessage(message, signature)).rejects.toThrow(/expired/i);
  });
});
