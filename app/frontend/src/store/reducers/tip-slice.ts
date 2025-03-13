import {createSlice, type PayloadAction} from '@reduxjs/toolkit';

import type {ITipFeed} from '../../types/tip';

export interface ITipState {
  feed: ITipFeed | null;
  loading: boolean;
  error: string | null;
}

const initialState: ITipState = {feed: null, loading: false, error: null};

export const tipSlice = createSlice({
  name: 'tip',
  initialState,
  reducers: {
    setTipsLoading: (state, {payload}: PayloadAction<boolean>) => {
      state.loading = payload;
      state.error = null;
    },
    setTipFeed: (state, {payload}: PayloadAction<ITipFeed>) => {
      state.feed = payload;
      state.loading = false;
      state.error = null;
    },
    setTipsError: (state, {payload}: PayloadAction<string>) => {
      state.loading = false;
      state.error = payload;
    },
  },
});

export const {setTipsLoading, setTipFeed, setTipsError} = tipSlice.actions;

export default tipSlice.reducer;
