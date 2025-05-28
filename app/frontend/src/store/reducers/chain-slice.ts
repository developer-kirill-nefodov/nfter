import {createSlice, type PayloadAction} from '@reduxjs/toolkit';

import type {ILiveStatus} from '../../api/live';
import type {IChainStatus} from '../../types/chain';

export interface IChainState {
  status: IChainStatus | null;
  loading: boolean;
  live: ILiveStatus;
}

const initialState: IChainState = {status: null, loading: false, live: 'connecting'};

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
    setLiveStatus: (state, {payload}: PayloadAction<ILiveStatus>) => {
      state.live = payload;
    },
  },
});

export const {setChainStatus, setChainLoading, setLiveStatus} = chainSlice.actions;

export default chainSlice.reducer;
