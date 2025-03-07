import {createSlice, type PayloadAction} from '@reduxjs/toolkit';

export type IFlowStatus = 'idle' | 'pending' | 'success' | 'error';

export interface IAuthState {
  /** Seconds left before another reset link may be requested. 0 = free to send. */
  resetCooldown: number;
  /** Where the "email me a link" request got to. */
  forgotStatus: IFlowStatus;
  /** Where the "here is my new password" request got to. */
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
    /**
     * Screens clear their own flow status when they unmount. Without this, a
     * "success" left behind by a previous visit would bounce the next visitor
     * straight back out of the form before they could type in it.
     */
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
