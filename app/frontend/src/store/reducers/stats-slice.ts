import {createSlice, type PayloadAction} from '@reduxjs/toolkit';

import type {
  IActivityItem,
  ICollectorEntry,
  ILeaderboardEntry,
  IPublicStats,
} from '../../types/stats';

export interface IStatsState {
  stats: IPublicStats | null;
  leaderboard: ILeaderboardEntry[];
  collectors: ICollectorEntry[];
  activity: IActivityItem[];
  loading: boolean;
  /** The token this browser just minted — highlighted in the shop window. */
  highlight: string | null;
}

const initialState: IStatsState = {
  stats: null,
  leaderboard: [],
  collectors: [],
  activity: [],
  loading: true,
  highlight: null,
};

export const statsSlice = createSlice({
  name: 'stats',
  initialState,
  reducers: {
    setStats: (state, {payload}: PayloadAction<IPublicStats>) => {
      state.stats = payload;
      state.loading = false;
    },

    /**
     * Puts the token in the window the moment it is minted, without waiting for
     * the server's cached view to catch up. The refetch that follows will replace
     * it with the canonical row — this is only about not making the buyer stare
     * at a shelf that does not yet contain the thing they just bought.
     */
    showcaseMinted: (
      state,
      {payload}: PayloadAction<{tokenId: string; minter: string; name: string; image: string; rarity: string}>,
    ) => {
      state.highlight = payload.tokenId;

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
    // Never leaves the page stuck on a skeleton, whatever the API did.
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
