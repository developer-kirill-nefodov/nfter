import {createSlice, type PayloadAction} from '@reduxjs/toolkit';

import type {IChainStatus} from '../../types/chain';

export interface IChainState {
  status: IChainStatus | null;
  loading: boolean;
}

const initialState: IChainState = {status: null, loading: false};

export const chainSlice = createSlice({
  name: 'chain',
  initialState,
  reducers: {
    setChainStatus: (state, {payload}: PayloadAction<IChainStatus>) => {
      state.status = payload;
      state.loading = false;
    },
    setChainLoading: (state, {payload}: PayloadAction<boolean>) => {
      state.loading = payload;
    },
  },
});

export const {setChainStatus, setChainLoading} = chainSlice.actions;

export default chainSlice.reducer;
