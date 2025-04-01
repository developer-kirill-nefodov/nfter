import {createSlice, type PayloadAction} from '@reduxjs/toolkit';

import type {ICollectorEntry, ILeaderboardEntry, IPublicStats} from '../../types/stats';

export interface IStatsState {
  stats: IPublicStats | null;
  leaderboard: ILeaderboardEntry[];
  collectors: ICollectorEntry[];
  loading: boolean;
}

const initialState: IStatsState = {stats: null, leaderboard: [], collectors: [], loading: true};

export const statsSlice = createSlice({
  name: 'stats',
  initialState,
  reducers: {
    setStats: (state, {payload}: PayloadAction<IPublicStats>) => {
      state.stats = payload;
      state.loading = false;
    },
    setLeaderboard: (state, {payload}: PayloadAction<ILeaderboardEntry[]>) => {
      state.leaderboard = payload;
      state.loading = false;
    },
    setCollectors: (state, {payload}: PayloadAction<ICollectorEntry[]>) => {
      state.collectors = payload;
      state.loading = false;
    },
    // Never leaves the page stuck on a skeleton, whatever the API did.
    setStatsLoaded: (state) => {
      state.loading = false;
    },
  },
});

export const {setStats, setLeaderboard, setCollectors, setStatsLoaded} = statsSlice.actions;

export default statsSlice.reducer;
