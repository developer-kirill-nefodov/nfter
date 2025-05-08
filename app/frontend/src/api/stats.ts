import {api} from './client';
import type {
  IActivityItem,
  ICollectorEntry,
  ILeaderboardEntry,
  IPublicStats,
} from '../types/stats';

export const statsApi = {
  public: async (refresh = false): Promise<IPublicStats> => {
    const {data} = await api.get<IPublicStats>('/stats/public', {
      params: refresh ? {refresh: 'true'} : undefined,
    });

    return data;
  },

  leaderboard: async (): Promise<ILeaderboardEntry[]> => {
    const {data} = await api.get<{entries: ILeaderboardEntry[]}>('/tips/leaderboard');
    return data.entries;
  },

  collectors: async (): Promise<ICollectorEntry[]> => {
    const {data} = await api.get<{entries: ICollectorEntry[]}>('/stats/collectors');
    return data.entries;
  },

  activity: async (): Promise<IActivityItem[]> => {
    const {data} = await api.get<{items: IActivityItem[]}>('/stats/activity');
    return data.items;
  },
};
