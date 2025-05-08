import {createSlice, type PayloadAction} from '@reduxjs/toolkit';

import type {
  IActivityItem,
  ICollectorEntry,
  ILeaderboardEntry,
  IPublicStats,
  IShowcaseItem,
} from '../../types/stats';

export interface IStatsState {
  stats: IPublicStats | null;
  leaderboard: ILeaderboardEntry[];
  collectors: ICollectorEntry[];
  activity: IActivityItem[];
  loading: boolean;
  highlight: string | null;
  justMinted: IShowcaseItem | null;
}

const initialState: IStatsState = {
  stats: null,
  leaderboard: [],
  collectors: [],
  activity: [],
  loading: true,
  highlight: null,
  justMinted: null,
};

export const statsSlice = createSlice({
  name: 'stats',
  initialState,
  reducers: {
    setStats: (state, {payload}: PayloadAction<IPublicStats>) => {
      state.stats = payload;
      state.loading = false;

      const pending = state.justMinted;

      if (!pending) {
        return;
      }

      const known = payload.artifactShowcase.some((item) => item.tokenId === pending.tokenId);

      if (known) {
        state.justMinted = null;
        return;
      }

      state.stats.artifactShowcase = [pending, ...payload.artifactShowcase];
      state.stats.artifactsMinted = payload.artifactsMinted + 1;
    },

    showcaseMinted: (state, {payload}: PayloadAction<IShowcaseItem>) => {
      state.highlight = payload.tokenId;
      state.justMinted = payload;

      if (!state.stats) {
        return;
      }

      state.stats.artifactsMinted += 1;
      state.stats.artifactShowcase = [
        payload,
        ...state.stats.artifactShowcase.filter((item) => item.tokenId !== payload.tokenId),
      ];
    },

    clearHighlight: (state) => {
      state.highlight = null;
    },
    setLeaderboard: (state, {payload}: PayloadAction<ILeaderboardEntry[]>) => {
      state.leaderboard = payload;
      state.loading = false;
    },
    setCollectors: (state, {payload}: PayloadAction<ICollectorEntry[]>) => {
      state.collectors = payload;
      state.loading = false;
    },
    setActivity: (state, {payload}: PayloadAction<IActivityItem[]>) => {
      state.activity = payload;
    },
    setStatsLoaded: (state) => {
      state.loading = false;
    },
  },
});

export const {
  setStats,
  setLeaderboard,
  setCollectors,
  setActivity,
  setStatsLoaded,
  showcaseMinted,
  clearHighlight,
} = statsSlice.actions;

export default statsSlice.reducer;
