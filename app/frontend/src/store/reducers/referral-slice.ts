import {createSlice, type PayloadAction} from '@reduxjs/toolkit';

import type {IInviterEntry, IReferralStats, ITreasury} from '../../types/referral';

export interface IReferralState {
  stats: IReferralStats | null;
  inviters: IInviterEntry[];
  treasury: ITreasury | null;
  /** An invite code typed at sign-up, held until the account exists. */
  pendingCode: string | null;
}

const initialState: IReferralState = {
  stats: null,
  inviters: [],
  treasury: null,
  pendingCode: null,
};

export const referralSlice = createSlice({
  name: 'referral',
  initialState,
  reducers: {
    setReferralStats: (state, {payload}: PayloadAction<IReferralStats>) => {
      state.stats = payload;
    },
    setInviters: (state, {payload}: PayloadAction<IInviterEntry[]>) => {
      state.inviters = payload;
    },
    setTreasury: (state, {payload}: PayloadAction<ITreasury | null>) => {
      state.treasury = payload;
    },
    setPendingCode: (state, {payload}: PayloadAction<string | null>) => {
      state.pendingCode = payload;
    },
  },
});

export const {setReferralStats, setInviters, setTreasury, setPendingCode} = referralSlice.actions;

export default referralSlice.reducer;
