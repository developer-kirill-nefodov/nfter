import {useCallback, useEffect, useState} from 'react';

import {hasWallet} from '../web3/wallet';

/**
 * MetaMask injects `window.ethereum` from a content script, which routinely
 * lands *after* React's first render — and if you only look once, the app tells
 * a user who plainly has MetaMask installed to go install MetaMask, forever.
 *
 * So: listen for the announcement the extension makes when it is ready, poll
 * briefly to cover wallets that make no announcement at all, and expose a manual
 * recheck for the user who just installed one in another tab.
 */
export const useHasWallet = () => {
  const [installed, setInstalled] = useState(hasWallet);

  const recheck = useCallback(() => {
    const found = hasWallet();
    setInstalled(found);
    return found;
  }, []);

  useEffect(() => {
    if (installed) {
      return;
    }

    // The legacy signal, and EIP-6963, which is how modern wallets announce.
    const onReady = () => recheck();

    window.addEventListener('ethereum#initialized', onReady);
    window.addEventListener('eip6963:announceProvider', onReady);
    window.dispatchEvent(new Event('eip6963:requestProvider'));

    // Some wallets do neither. Give them a few seconds, then stop — a permanent
    // interval on a page with no wallet is pure waste.
    const started = Date.now();
    const timer = setInterval(() => {
      if (recheck() || Date.now() - started > 3000) {
        clearInterval(timer);
      }
    }, 300);

    return () => {
      clearInterval(timer);
      window.removeEventListener('ethereum#initialized', onReady);
      window.removeEventListener('eip6963:announceProvider', onReady);
    };
  }, [installed, recheck]);

  return {installed, recheck};
};
