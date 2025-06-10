import {createSlice, type PayloadAction} from '@reduxjs/toolkit';

export type ITxStage =
  | 'idle'
  | 'approving'
  | 'estimating'
  | 'signing'
  | 'pending'
  | 'confirmed'
  | 'failed';

export type ITxKind = 'claim' | 'tip' | 'mint' | 'list' | 'buy' | 'cancel' | 'withdraw';

export interface ITxState {
  kind: ITxKind | null;
  stage: ITxStage;
  hash: string | null;
  error: string | null;
  rejected: boolean;
  gasEstimate: string | null;
  outcome: string | null;
}

const initialState: ITxState = {
  kind: null,
  stage: 'idle',
  hash: null,
  error: null,
  rejected: false,
  gasEstimate: null,
  outcome: null,
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
      state.outcome = null;
    },
    txApproving: (state) => {
      state.stage = 'approving';
    },
    txGasEstimated: (state, {payload}: PayloadAction<string>) => {
      state.gasEstimate = payload;
      state.stage = 'signing';
    },
    txBroadcast: (state, {payload}: PayloadAction<string>) => {
      state.hash = payload;
      state.stage = 'pending';
    },
    txConfirmed: (state, {payload}: PayloadAction<string | undefined>) => {
      state.stage = 'confirmed';
      state.outcome = payload ?? null;
    },
    txFailed: (state, {payload}: PayloadAction<{message: string; rejected: boolean}>) => {
      state.stage = 'failed';
      state.error = payload.message;
      state.rejected = payload.rejected;
    },
    txReset: () => initialState,
  },
});

export const {
  txStarted,
  txApproving,
  txGasEstimated,
  txBroadcast,
  txConfirmed,
  txFailed,
  txReset,
} = txSlice.actions;

export default txSlice.reducer;
