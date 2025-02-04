import {createSlice, type PayloadAction} from '@reduxjs/toolkit';

import type {INftCollection} from '../../types/nft';

export interface INftState {
  collection: INftCollection | null;
  loading: boolean;
  error: string | null;
}

const initialState: INftState = {
  collection: null,
  loading: false,
  error: null,
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
    clearNfts: () => initialState,
  },
});

export const {setNftLoading, setNftCollection, setNftError, clearNfts} = nftSlice.actions;

export default nftSlice.reducer;
