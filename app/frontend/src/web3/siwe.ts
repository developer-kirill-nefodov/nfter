import {CHAIN_ID} from './wallet';

export const buildSiweMessage = (address: string, nonce: string): string => {
  const lines = [
    `${window.location.host} wants you to sign in with your Ethereum account:`,
    address,
    '',
    'Sign in to nfter. This request will not trigger a transaction.',
    '',
    `URI: ${window.location.origin}`,
    'Version: 1',
    `Chain ID: ${CHAIN_ID}`,
    `Nonce: ${nonce}`,
    `Issued At: ${new Date().toISOString()}`,
  ];

  return lines.join('\n');
};
