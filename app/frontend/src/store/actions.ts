import {createAction} from '@reduxjs/toolkit';

/**
 * Saga triggers. Using createAction instead of hand-written `{type: '...'}`
 * literals means the payload type is declared once and every `put`, `take` and
 * `dispatch` is checked against it.
 */
export const bootstrapSession = createAction('session/bootstrap');

export const loginRequest = createAction<{email: string; password: string}>('auth/login');
export const registerRequest = createAction<{email: string; password: string}>('auth/register');
export const logoutRequest = createAction('auth/logout');

export const forgotPasswordRequest = createAction<{email: string}>('auth/forgotPassword');
export const resetPasswordRequest = createAction<{token: string; password: string}>(
  'auth/resetPassword',
);

/** Connect the wallet and sign in with it (SIWE). */
export const walletLoginRequest = createAction('wallet/login');
/** Connect the wallet and attach it to the account already signed in. */
export const walletLinkRequest = createAction('wallet/link');
export const walletAccountChanged = createAction<string | null>('wallet/accountChanged');
export const walletChainChanged = createAction<number>('wallet/chainChanged');

export const fetchNftsRequest = createAction<{refresh?: boolean} | undefined>('nft/fetch');
