import {useEffect} from 'react';

import {walletAccountChanged, walletChainChanged} from '../store/actions';
import {useStoreDispatch} from '../store/hooks';

/**
 * MetaMask can change the account or the network out from under the app at any
 * moment, and it never asks first. Without these listeners the UI would keep
 * showing a collection that belongs to an address the user has already left.
 */
export const useWalletEvents = () => {
  const dispatch = useStoreDispatch();

  useEffect(() => {
    const provider = window.ethereum;

    if (!provider?.on || !provider.removeListener) {
      return;
    }

    const onAccountsChanged = (...args: never[]) => {
      const accounts = args[0] as unknown as string[];
      dispatch(walletAccountChanged(accounts[0] ?? null));
    };

    const onChainChanged = (...args: never[]) => {
      const chainId = args[0] as unknown as string;
      dispatch(walletChainChanged(Number.parseInt(chainId, 16)));
    };

    provider.on('accountsChanged', onAccountsChanged);
    provider.on('chainChanged', onChainChanged);

    return () => {
      provider.removeListener?.('accountsChanged', onAccountsChanged);
      provider.removeListener?.('chainChanged', onChainChanged);
    };
  }, [dispatch]);
};
