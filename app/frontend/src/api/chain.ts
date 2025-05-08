import {api} from './client';
import type {IChainStatus} from '../types/chain';

export const chainApi = {
  status: async (): Promise<IChainStatus> => {
    const {data} = await api.get<IChainStatus>('/stats/chain');
    return data;
  },
};
