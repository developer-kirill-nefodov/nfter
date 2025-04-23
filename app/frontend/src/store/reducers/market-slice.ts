import {createSlice, type PayloadAction} from '@reduxjs/toolkit';

import type {IMarket} from '../../types/market';

export interface IMarketState {
  book: IMarket | null;
  loading: boolean;
  error: string | null;
  /** What this wallet has earned from sales and not yet withdrawn, in wei. */
  proceeds: string | null;
}

const initialState: IMarketState = {book: null, loading: true, error: null, proceeds: null};

export const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {
    setMarketLoading: (state, {payload}: PayloadAction<boolean>) => {
      state.loading = payload;
      state.error = null;
    },
    setMarket: (state, {payload}: PayloadAction<IMarket>) => {
      state.book = payload;
      state.loading = false;
      state.error = null;
    },
    setMarketError: (state, {payload}: PayloadAction<string>) => {
      state.loading = false;
      state.error = payload;
    },
    setProceeds: (state, {payload}: PayloadAction<string>) => {
      state.proceeds = payload;
    },
  },
});

export const {setMarketLoading, setMarket, setMarketError, setProceeds} = marketSlice.actions;

export default marketSlice.reducer;
