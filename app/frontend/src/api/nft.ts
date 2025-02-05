import {api} from './client';
import type {INftCollection} from '../types/nft';

export const nftApi = {
  myCollection: async (refresh = false): Promise<INftCollection> => {
    const {data} = await api.get<INftCollection>('/nft/my-collection', {
      params: refresh ? {refresh: 'true'} : undefined,
    });

    return data;
  },
};
