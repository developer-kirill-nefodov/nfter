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

/**
 * Byte-for-byte what app/frontend/src/web3/siwe.ts emits.
 *
 * The browser cannot use the `siwe` package — it depends on apg-js, which needs
 * Node's Buffer — so the client formats the EIP-4361 message itself. This test
 * is the contract between the two: if the client's template ever drifts from
 * what the server's parser accepts, wallet sign-in breaks in production and
 * nowhere else. It fails here instead.
 */
const clientSideMessage = (address: string, nonce: string, issuedAt: string) =>
  [
    `localhost:3000 wants you to sign in with your Ethereum account:`,
    address,
    '',
    'Sign in to ethers-web3. This request will not trigger a transaction.',
    '',
    `URI: http://localhost:3000`,
    'Version: 1',
    `Chain ID: 11155111`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join('\n');

describe('the message the browser builds by hand', () => {
  beforeEach(() => {
    redis.store.clear();
  });

  it('parses and verifies through the real siwe library', async () => {
    const nonce = await issueNonce();
    const message = clientSideMessage(wallet.address, nonce, new Date().toISOString());
    const signature = await wallet.signMessage(message);

    await expect(verifySiweMessage(message, signature)).resolves.toBe(
      wallet.address.toLowerCase(),
    );
  });

  it('is field-for-field what siwe itself would have produced', async () => {
    const nonce = await issueNonce();
    const issuedAt = new Date().toISOString();

    const parsed = new SiweMessage(clientSideMessage(wallet.address, nonce, issuedAt));

    expect(parsed).toMatchObject({
      domain: 'localhost:3000',
      address: wallet.address,
      uri: 'http://localhost:3000',
      version: '1',
      chainId: 11155111,
      nonce,
      issuedAt,
    });
  });
});

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
