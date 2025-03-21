import {createSlice, type PayloadAction} from '@reduxjs/toolkit';

import type {ILeaderboardEntry, IPublicStats} from '../../types/stats';

export interface IStatsState {
  stats: IPublicStats | null;
  leaderboard: ILeaderboardEntry[];
  loading: boolean;
}

const initialState: IStatsState = {stats: null, leaderboard: [], loading: true};

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
    },
    // Never leaves the page stuck on a skeleton, whatever the API did.
    setStatsLoaded: (state) => {
      state.loading = false;
    },
  },
});

export const {setStats, setLeaderboard, setStatsLoaded} = statsSlice.actions;

export default statsSlice.reducer;
