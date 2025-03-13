import {api} from './client';
import type {ITipFeed} from '../types/tip';

export const tipApi = {
  feed: async (refresh = false): Promise<ITipFeed> => {
    const {data} = await api.get<ITipFeed>('/tips/feed', {
      params: refresh ? {refresh: 'true'} : undefined,
    });

    return data;
  },
};
