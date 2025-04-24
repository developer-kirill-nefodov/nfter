import {call, put, select, takeLatest} from 'redux-saga/effects';

import {runTransaction} from './run-transaction';

import type {RootState} from '../';

import {errorMessage} from '../../api/client';
import {tipApi} from '../../api/tip';
import {toast} from '../../components/Toastify/toast';
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
  const result: IMintResult | null = yield call(runTransaction<IMintResult>, 'claim', claimPass);

  if (!result) {
    return;
  }

  yield put(setClaimed(true));
  // The gallery is cached server-side; ask for a fresh read now that the pass
  // actually exists on chain.
  yield put(fetchNftsRequest({refresh: true}));
  yield put(refreshBalanceRequest());

  if (result.token) {
    // Show the thing they just got. A toast saying "minted" is not a reward.
    yield put(setReveal({token: result.token, contract: result.contract, txHash: result.hash}));
  }

  toast('Your pass is minted.', 'success');
}

function* sendTipSaga({payload}: ReturnType<typeof sendTipRequest>) {
  const hash: string | null = yield call(runTransaction<string>, 'tip', (handlers) =>
    sendTip(BigInt(payload.amountWei), payload.message, handlers),
  );

  if (hash) {
    yield put(fetchTipsRequest({refresh: true}));
    yield put(refreshBalanceRequest());
    toast('Thank you — your tip is on chain.', 'success');
  }
}

function* mintArtifactSaga({payload}: ReturnType<typeof mintArtifactRequest>) {
  const result: IMintResult | null = yield call(runTransaction<IMintResult>, 'mint', (handlers) =>
    mintArtifact(payload, handlers),
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

    // Show it in the window straight away — the server's view is cached and does
    // not know about this token yet.
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

  // …and reconcile with the chain once the indexer has caught up.
  yield put(fetchStatsRequest({refresh: true}));

  toast('Your artifact is minted.', 'success');
}

function* fetchTiersSaga() {
  try {
    const tiers: Record<ITier, ITierInfo> = yield call(readTiers);
    yield put(setTiers(tiers));
  } catch {
    // Without a wallet there is no signer to ask; the caps still show as "—".
  }
}

function* checkClaimSaga({payload}: ReturnType<typeof checkClaimRequest>) {
  try {
    const claimed: boolean = yield call(hasClaimed, payload);
    yield put(setClaimed(claimed));
  } catch {
    // Not knowing yet is fine — the claim itself would revert anyway, with a
    // real message, so there is nothing worth interrupting the user for.
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
    // A balance we cannot read is shown as "—", which is honest enough.
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
