import {createAction} from '@reduxjs/toolkit';

export const bootstrapSession = createAction('session/bootstrap');

export const loginRequest = createAction<{email: string; password: string}>('auth/login');
export const registerRequest = createAction<{
  email: string;
  password: string;
  inviteCode?: string;
}>('auth/register');
export const logoutRequest = createAction('auth/logout');

export const forgotPasswordRequest = createAction<{email: string}>('auth/forgotPassword');
export const resetPasswordRequest = createAction<{token: string; password: string}>(
  'auth/resetPassword',
);

export const walletLinkRequest = createAction('wallet/link');
export const walletUnlinkRequest = createAction('wallet/unlink');
export const walletAccountChanged = createAction<string | null>('wallet/accountChanged');
export const walletChainChanged = createAction<number>('wallet/chainChanged');

export const fetchNftsRequest = createAction<{refresh?: boolean} | undefined>('nft/fetch');

export const mintArtifactRequest = createAction<0 | 1 | 2 | 3>('tx/mintArtifact');
export const fetchTiersRequest = createAction('tx/fetchTiers');
export const refreshBalanceRequest = createAction('wallet/refreshBalance');

export const claimPassRequest = createAction('tx/claimPass');
export const checkClaimRequest = createAction<string>('tx/checkClaim');
export const sendTipRequest = createAction<{amountWei: string; message: string}>('tx/sendTip');
export const fetchTipsRequest = createAction<{refresh?: boolean} | undefined>('tip/fetch');

export const fetchStatsRequest = createAction<{refresh?: boolean} | undefined>('stats/fetch');
export const fetchLeaderboardRequest = createAction('stats/leaderboard');
export const fetchCollectorsRequest = createAction('stats/collectors');
export const fetchActivityRequest = createAction('stats/activity');

export const fetchMarketRequest = createAction<{refresh?: boolean} | undefined>('market/fetch');
export const fetchProceedsRequest = createAction('market/proceeds');

export const listTokenRequest = createAction<{
  collection: string;
  tokenId: string;
  priceWei: string;
}>('market/list');
export const buyListingRequest = createAction<{
  collection: string;
  tokenId: string;
  priceWei: string;
}>('market/buy');
export const cancelListingRequest = createAction<{collection: string; tokenId: string}>(
  'market/cancel',
);
export const withdrawProceedsRequest = createAction('market/withdraw');

export const fetchReferralsRequest = createAction('referral/fetch');
export const fetchInvitersRequest = createAction('referral/inviters');
export const fetchTreasuryRequest = createAction('referral/treasury');
export const withdrawReferralRequest = createAction('referral/withdraw');

export const fetchChainRequest = createAction('chain/fetch');
