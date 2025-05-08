import {createSlice, type PayloadAction} from '@reduxjs/toolkit';

export type ITxStage = 'idle' | 'estimating' | 'signing' | 'pending' | 'confirmed' | 'failed';

export type ITxKind = 'claim' | 'tip' | 'mint' | 'list' | 'buy' | 'cancel' | 'withdraw';

export interface ITxState {
  kind: ITxKind | null;
  stage: ITxStage;
  hash: string | null;
  error: string | null;
  rejected: boolean;
  gasEstimate: string | null;
}

const initialState: ITxState = {
  kind: null,
  stage: 'idle',
  hash: null,
  error: null,
  rejected: false,
  gasEstimate: null,
};

export const txSlice = createSlice({
  name: 'tx',
  initialState,
  reducers: {
    txStarted: (state, {payload}: PayloadAction<ITxKind>) => {
      state.kind = payload;
      state.stage = 'estimating';
      state.hash = null;
      state.error = null;
      state.rejected = false;
      state.gasEstimate = null;
    },
    txGasEstimated: (state, {payload}: PayloadAction<string>) => {
      state.gasEstimate = payload;
      state.stage = 'signing';
    },
    txBroadcast: (state, {payload}: PayloadAction<string>) => {
      state.hash = payload;
      state.stage = 'pending';
    },
    txConfirmed: (state) => {
      state.stage = 'confirmed';
    },
    txFailed: (state, {payload}: PayloadAction<{message: string; rejected: boolean}>) => {
      state.stage = 'failed';
      state.error = payload.message;
      state.rejected = payload.rejected;
    },
    txReset: () => initialState,
  },
});

export const {txStarted, txGasEstimated, txBroadcast, txConfirmed, txFailed, txReset} =
  txSlice.actions;

export default txSlice.reducer;
