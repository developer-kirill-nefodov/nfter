import {api} from './client';
import type {ICollectorEntry, ILeaderboardEntry, IPublicStats} from '../types/stats';

export const statsApi = {
  /** Public: the landing page must explain itself before anyone connects. */
  public: async (): Promise<IPublicStats> => {
    const {data} = await api.get<IPublicStats>('/stats/public');
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
};
