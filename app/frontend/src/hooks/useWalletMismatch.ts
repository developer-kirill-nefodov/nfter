import {useEffect, useState} from 'react';

import {useStoreSelector} from '../store/hooks';
import {activeAccount} from '../web3/wallet';

export const useWalletMismatch = (): string | null => {
  const linked = useStoreSelector((state) => state.user.user.walletAddress);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!linked) {
      setActive(null);
      return;
    }

    let current = true;

    const read = () => {
      void activeAccount().then((address) => {
        if (current) {
          setActive(address);
        }
      });
    };

    read();

    window.ethereum?.on?.('accountsChanged', read);

    return () => {
      current = false;
      window.ethereum?.removeListener?.('accountsChanged', read);
    };
  }, [linked]);

  if (!linked || !active) {
    return null;
  }

  return active.toLowerCase() === linked.toLowerCase() ? null : active;
};
