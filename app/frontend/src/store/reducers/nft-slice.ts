import {createSlice, type PayloadAction} from '@reduxjs/toolkit';

import type {INft, IWalletHoldings} from '../../types/nft';
import type {ITier} from '../../web3/contracts';
import type {ITierInfo} from '../../web3/transactions';

export interface INftState {
  holdings: IWalletHoldings | null;
  loading: boolean;
  error: string | null;
  claimed: boolean | null;
  tiers: Record<ITier, ITierInfo> | null;
  reveal: {token: INft; contract: string; txHash: string} | null;
}

const initialState: INftState = {
  holdings: null,
  loading: false,
  error: null,
  claimed: null,
  tiers: null,
  reveal: null,
};

export const nftSlice = createSlice({
  name: 'nft',
  initialState,
  reducers: {
    setNftLoading: (state, {payload}: PayloadAction<boolean>) => {
      state.loading = payload;
      state.error = null;
    },
    setNftCollection: (state, {payload}: PayloadAction<IWalletHoldings>) => {
      state.holdings = payload;
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
    setTiers: (state, {payload}: PayloadAction<Record<ITier, ITierInfo> | null>) => {
      state.tiers = payload;
    },
    setReveal: (
      state,
      {payload}: PayloadAction<{token: INft; contract: string; txHash: string}>,
    ) => {
      state.reveal = payload;
    },
    clearReveal: (state) => {
      state.reveal = null;
    },
    clearNfts: () => initialState,
  },
});

export const {
  setNftLoading,
  setNftCollection,
  setNftError,
  setClaimed,
  setTiers,
  setReveal,
  clearReveal,
  clearNfts,
} = nftSlice.actions;

export default nftSlice.reducer;
