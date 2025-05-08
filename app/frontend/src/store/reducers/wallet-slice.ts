import {createSlice, type PayloadAction} from '@reduxjs/toolkit';

export type IWalletStatus = 'disconnected' | 'connecting' | 'signing' | 'connected';

export interface IWalletState {
  address: string | null;
  chainId: number | null;
  status: IWalletStatus;
  error: string | null;
  balance: string | null;
}

const initialState: IWalletState = {
  address: null,
  chainId: null,
  status: 'disconnected',
  error: null,
  balance: null,
};

export const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setWalletStatus: (state, {payload}: PayloadAction<IWalletStatus>) => {
      state.status = payload;

      if (payload !== 'disconnected') {
        state.error = null;
      }
    },
    setWallet: (state, {payload}: PayloadAction<{address: string; chainId: number}>) => {
      state.address = payload.address;
      state.chainId = payload.chainId;
      state.status = 'connected';
      state.error = null;
    },
    setChainId: (state, {payload}: PayloadAction<number>) => {
      state.chainId = payload;
    },
    setBalance: (state, {payload}: PayloadAction<string>) => {
      state.balance = payload;
    },
    setWalletError: (state, {payload}: PayloadAction<string>) => {
      state.status = 'disconnected';
      state.error = payload;
    },
    disconnectWallet: () => initialState,
  },
});

export const {
  setWalletStatus,
  setWallet,
  setChainId,
  setBalance,
  setWalletError,
  disconnectWallet,
} = walletSlice.actions;

export default walletSlice.reducer;
