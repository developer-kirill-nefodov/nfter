import {CHAIN_ID} from './wallet';

/**
 * Builds the EIP-4361 message the wallet will sign.
 *
 * This deliberately does *not* use the `siwe` package. That package depends on
 * @spruceid/siwe-parser → apg-js, which reaches for Node's Buffer; Vite
 * externalizes `buffer` for the browser, so the call blew up the moment it was
 * reached — the app fetched a nonce and then died before it could ask the wallet
 * to sign anything.
 *
 * Producing the message is just string formatting against a fully specified
 * grammar, so there is nothing to gain from a dependency. Verification — the
 * half that actually has to be right — still runs through the real `siwe`
 * library on the server, where Buffer exists. A backend test asserts that a
 * message in exactly this shape parses and verifies there.
 *
 * Domain and URI come from the live location, because the backend compares them
 * against its own FRONTEND_URL and rejects a mismatch. That check is what stops
 * a phishing page from getting a signature it could replay against us.
 */
export const buildSiweMessage = (address: string, nonce: string): string => {
  const lines = [
    `${window.location.host} wants you to sign in with your Ethereum account:`,
    address,
    '',
    'Sign in to ethers-web3. This request will not trigger a transaction.',
    '',
    `URI: ${window.location.origin}`,
    'Version: 1',
    `Chain ID: ${CHAIN_ID}`,
    `Nonce: ${nonce}`,
    `Issued At: ${new Date().toISOString()}`,
  ];

  return lines.join('\n');
};
