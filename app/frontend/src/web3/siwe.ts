import {CHAIN_ID} from './wallet';

/**
 * Builds the EIP-4361 message the wallet will sign.
 *
 * Domain and URI are read from the live location rather than hardcoded, because
 * the backend compares them against its own FRONTEND_URL and rejects anything
 * that does not match — that check is what stops a phishing page from getting a
 * signature it could replay against us.
 *
 * `siwe` is imported lazily for the same reason ethers is: it is only ever
 * needed once the user has decided to connect a wallet.
 */
export const buildSiweMessage = async (address: string, nonce: string): Promise<string> => {
  const {SiweMessage} = await import('siwe');

  return new SiweMessage({
    domain: window.location.host,
    address,
    statement: 'Sign in to ethers-web3. This request will not trigger a transaction.',
    uri: window.location.origin,
    version: '1',
    chainId: CHAIN_ID,
    nonce,
    issuedAt: new Date().toISOString(),
  }).prepareMessage();
};
