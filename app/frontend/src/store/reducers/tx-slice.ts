import {createSlice, type PayloadAction} from '@reduxjs/toolkit';

/**
 * A transaction is not a request/response — it is a small state machine, and
 * pretending otherwise is what makes most dapps feel broken. Every stage below
 * is a thing the user can actually be waiting on:
 *
 *   estimating → the wallet has not been opened yet; we are pricing the call
 *   signing    → MetaMask is open, waiting on a human
 *   pending    → broadcast, sitting in the mempool, hash known
 *   confirmed  → mined, and the chain agrees
 *   failed     → rejected, reverted, or out of gas
 */
export type ITxStage = 'idle' | 'estimating' | 'signing' | 'pending' | 'confirmed' | 'failed';

export type ITxKind = 'claim' | 'tip' | 'mint';

export interface ITxState {
  kind: ITxKind | null;
  stage: ITxStage;
  hash: string | null;
  error: string | null;
  /** True when the user declined in the wallet, rather than something breaking. */
  rejected: boolean;
  /** Estimated cost in wei, shown before the wallet is ever opened. */
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
