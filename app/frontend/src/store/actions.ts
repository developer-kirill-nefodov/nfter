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

/** Connect a wallet and attach it to the signed-in account (proved with SIWE). */
export const walletLinkRequest = createAction('wallet/link');
/** Detach it again, and drop the site's permission inside the wallet itself. */
export const walletUnlinkRequest = createAction('wallet/unlink');
export const walletAccountChanged = createAction<string | null>('wallet/accountChanged');
export const walletChainChanged = createAction<number>('wallet/chainChanged');

export const fetchNftsRequest = createAction<{refresh?: boolean} | undefined>('nft/fetch');

/** Buy an artifact of the chosen tier. */
export const mintArtifactRequest = createAction<0 | 1 | 2 | 3>('tx/mintArtifact');
/** How many of each tier are left, read from the contract. */
export const fetchTiersRequest = createAction('tx/fetchTiers');
/** Re-read the wallet's ETH balance — after every confirmed transaction. */
export const refreshBalanceRequest = createAction('wallet/refreshBalance');

/** Mint the one-per-wallet generative pass. */
export const claimPassRequest = createAction('tx/claimPass');
/** Ask the chain whether this wallet already has one. */
export const checkClaimRequest = createAction<string>('tx/checkClaim');
/** Tip the jar: amount in wei, plus an optional note stored in the event log. */
export const sendTipRequest = createAction<{amountWei: string; message: string}>('tx/sendTip');
export const fetchTipsRequest = createAction<{refresh?: boolean} | undefined>('tip/fetch');

/** Public numbers and recent mints for the landing page — no wallet needed. */
export const fetchStatsRequest = createAction('stats/fetch');
export const fetchLeaderboardRequest = createAction('stats/leaderboard');
