import {createSlice, type PayloadAction} from '@reduxjs/toolkit';

export interface IAuthState {
  /** Seconds left before another reset link may be requested. 0 = free to send. */
  resetCooldown: number;
}

const initialState: IAuthState = {
  resetCooldown: 0,
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
  },
});

export const {setResetCooldown, tickResetCooldown} = authSlice.actions;

export default authSlice.reducer;
