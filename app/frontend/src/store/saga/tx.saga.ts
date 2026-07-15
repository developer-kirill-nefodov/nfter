import {call, put, select, takeLatest} from 'redux-saga/effects';

import {resolveReferrer} from './referrer';
import {runTransaction} from './run-transaction';

import type {RootState} from '../';

import {errorMessage} from '../../api/client';
import {tipApi} from '../../api/tip';
import type {ITipFeed} from '../../types/tip';
import {
  claimPass,
  hasClaimed,
  mintArtifact,
  readBalance,
  readTiers,
  sendTip,
  type IMintResult,
  type ITierInfo,
} from '../../web3/transactions';
import type {ITier} from '../../web3/contracts';
import {
  checkClaimRequest,
  claimPassRequest,
  fetchNftsRequest,
  fetchStatsRequest,
  fetchTiersRequest,
  fetchTipsRequest,
  mintArtifactRequest,
  refreshBalanceRequest,
  sendTipRequest,
} from '../actions';
import {setClaimed, setReveal, setTiers} from '../reducers/nft-slice';
import {showcaseMinted} from '../reducers/stats-slice';
import {setBalance} from '../reducers/wallet-slice';
import {setTipFeed, setTipsError, setTipsLoading} from '../reducers/tip-slice';

function* claimSaga() {
  const result: IMintResult | null = yield call(
    runTransaction<IMintResult>,
    'claim',
    claimPass,
    'Your pass is minted.',
  );

  if (!result) {
    return;
  }

  yield put(setClaimed(true));
  yield put(fetchNftsRequest({refresh: true}));
  yield put(refreshBalanceRequest());

  if (result.token) {
    yield put(setReveal({token: result.token, contract: result.contract, txHash: result.hash}));
  }

}

function* sendTipSaga({payload}: ReturnType<typeof sendTipRequest>) {
  const hash: string | null = yield call(
    runTransaction<string>,
    'tip',
    (handlers) => sendTip(BigInt(payload.amountWei), payload.message, handlers),
    'Thank you — your tip is on chain.',
  );

  if (hash) {
    yield put(fetchTipsRequest({refresh: true}));
    yield put(refreshBalanceRequest());
  }
}

function* mintArtifactSaga({payload}: ReturnType<typeof mintArtifactRequest>) {
  const referrer: string = yield call(resolveReferrer);

  const result: IMintResult | null = yield call(
    runTransaction<IMintResult>,
    'mint',
    (handlers) => mintArtifact(payload, handlers, referrer),
    'Your artifact is minted.',
  );

  if (!result) {
    return;
  }

  yield put(fetchTiersRequest());
  yield put(fetchNftsRequest({refresh: true}));
  yield put(refreshBalanceRequest());

  if (result.token) {
    const tier = result.token.attributes.find(({trait_type}) => trait_type === 'Tier');
    const wallet: string | null = yield select(
      (state: RootState) => state.user.user.walletAddress,
    );

    yield put(
      showcaseMinted({
        tokenId: result.token.tokenId,
        minter: wallet ?? '',
        name: result.token.name,
        image: result.token.image,
        rarity: String(tier?.value ?? ''),
      }),
    );

    yield put(setReveal({token: result.token, contract: result.contract, txHash: result.hash}));
  }

  yield put(fetchStatsRequest({refresh: true}));

}

function* fetchTiersSaga() {
  try {
    const tiers: Record<ITier, ITierInfo> = yield call(readTiers);
    yield put(setTiers(tiers));
  } catch {
    yield put(setTiers(null));
  }
}

function* checkClaimSaga({payload}: ReturnType<typeof checkClaimRequest>) {
  try {
    const claimed: boolean = yield call(hasClaimed, payload);
    yield put(setClaimed(claimed));
  } catch {
    // A failed read is not "has not claimed". Asserting false here shows the Claim card to a wallet
    // that already claimed, so the next click burns gas on a guaranteed AlreadyClaimed revert.
    // Leave the flag as-is and let the next successful read settle it.
  }
}

function* fetchTipsSaga({payload}: ReturnType<typeof fetchTipsRequest>) {
  yield put(setTipsLoading(true));

  try {
    const feed: ITipFeed = yield call(tipApi.feed, payload?.refresh ?? false);
    yield put(setTipFeed(feed));
  } catch (error) {
    yield put(setTipsError(errorMessage(error, 'Could not load the tip feed')));
  }
}

function* refreshBalanceSaga() {
  try {
    const wallet: string | null = yield select(
      (state: RootState) => state.user.user.walletAddress,
    );

    if (wallet) {
      const balance: string = yield call(readBalance, wallet);
      yield put(setBalance(balance));
    }
  } catch {
    // Don't flash a false 0 ETH on a transient RPC hiccup — keep the last known balance.
  }
}

export function* txSaga() {
  yield takeLatest(refreshBalanceRequest.type, refreshBalanceSaga);
  yield takeLatest(claimPassRequest.type, claimSaga);
  yield takeLatest(mintArtifactRequest.type, mintArtifactSaga);
  yield takeLatest(fetchTiersRequest.type, fetchTiersSaga);
  yield takeLatest(sendTipRequest.type, sendTipSaga);
  yield takeLatest(checkClaimRequest.type, checkClaimSaga);
  yield takeLatest(fetchTipsRequest.type, fetchTipsSaga);
}
