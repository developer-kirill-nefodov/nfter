import {useCallback, useEffect, useState} from 'react';

import {hasWallet} from '../web3/wallet';

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

    const onReady = () => recheck();

    window.addEventListener('ethereum#initialized', onReady);
    window.addEventListener('eip6963:announceProvider', onReady);
    window.dispatchEvent(new Event('eip6963:requestProvider'));

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
