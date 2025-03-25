import {createSlice, type PayloadAction} from '@reduxjs/toolkit';

import type {IWalletHoldings} from '../../types/nft';
import type {ITier} from '../../web3/contracts';
import type {ITierInfo} from '../../web3/transactions';

export interface INftState {
  holdings: IWalletHoldings | null;
  loading: boolean;
  error: string | null;
  /** null until the chain has been asked whether this wallet claimed its pass. */
  claimed: boolean | null;
  /** How many of each artifact tier are left. */
  tiers: Record<ITier, ITierInfo> | null;
}

const initialState: INftState = {
  holdings: null,
  loading: false,
  error: null,
  claimed: null,
  tiers: null,
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
    setTiers: (state, {payload}: PayloadAction<Record<ITier, ITierInfo>>) => {
      state.tiers = payload;
    },
    clearNfts: () => initialState,
  },
});

export const {setNftLoading, setNftCollection, setNftError, setClaimed, setTiers, clearNfts} =
  nftSlice.actions;

export default nftSlice.reducer;
