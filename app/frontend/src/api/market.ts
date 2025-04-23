import {api} from './client';
import type {IMarket} from '../types/market';

export const marketApi = {
  book: async (refresh = false): Promise<IMarket> => {
    const {data} = await api.get<IMarket>('/market/book', {
      params: refresh ? {refresh: 'true'} : undefined,
    });

    return data;
  },
};
