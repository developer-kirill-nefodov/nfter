import {createSlice, type PayloadAction} from '@reduxjs/toolkit';

export type IFlowStatus = 'idle' | 'pending' | 'success' | 'error';

export interface IAuthState {
  resetCooldown: number;
  forgotStatus: IFlowStatus;
  resetStatus: IFlowStatus;
}

const initialState: IAuthState = {
  resetCooldown: 0,
  forgotStatus: 'idle',
  resetStatus: 'idle',
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setResetCooldown: (state, {payload}: PayloadAction<number>) => {
      state.resetCooldown = payload;
    },
    tickResetCooldown: (state) => {
      state.resetCooldown = Math.max(0, state.resetCooldown - 1);
    },
    setForgotStatus: (state, {payload}: PayloadAction<IFlowStatus>) => {
      state.forgotStatus = payload;
    },
    setResetStatus: (state, {payload}: PayloadAction<IFlowStatus>) => {
      state.resetStatus = payload;
    },
    clearAuthFlow: (state) => {
      state.forgotStatus = 'idle';
      state.resetStatus = 'idle';
    },
  },
});

export const {
  setResetCooldown,
  tickResetCooldown,
  setForgotStatus,
  setResetStatus,
  clearAuthFlow,
} = authSlice.actions;

export default authSlice.reducer;
