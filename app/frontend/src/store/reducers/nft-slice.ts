import {createSlice, type PayloadAction} from '@reduxjs/toolkit';

import type {INftCollection} from '../../types/nft';

export interface INftState {
  collection: INftCollection | null;
  loading: boolean;
  error: string | null;
  /** null until the chain has been asked whether this wallet claimed its pass. */
  claimed: boolean | null;
}

const initialState: INftState = {
  collection: null,
  loading: false,
  error: null,
  claimed: null,
};

export const nftSlice = createSlice({
  name: 'nft',
  initialState,
  reducers: {
    setNftLoading: (state, {payload}: PayloadAction<boolean>) => {
      state.loading = payload;
      state.error = null;
    },
    setNftCollection: (state, {payload}: PayloadAction<INftCollection>) => {
      state.collection = payload;
      state.loading = false;
      state.error = null;
    },
    setNftError: (state, {payload}: PayloadAction<string>) => {
      state.loading = false;
      state.error = payload;
    },
    setClaimed: (state, {payload}: PayloadAction<boolean>) => {
      state.claimed = payload;
    },
    clearNfts: () => initialState,
  },
});

export const {setNftLoading, setNftCollection, setNftError, setClaimed, clearNfts} =
  nftSlice.actions;

export default nftSlice.reducer;
