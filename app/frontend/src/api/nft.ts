import {api} from './client';
import type {IWalletHoldings} from '../types/nft';

export const nftApi = {
  myCollection: async (refresh = false): Promise<IWalletHoldings> => {
    const {data} = await api.get<IWalletHoldings>('/nft/my-collection', {
      params: refresh ? {refresh: 'true'} : undefined,
    });

    return data;
  },
};
