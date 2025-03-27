import {call, put, select, takeLatest} from 'redux-saga/effects';

import type {RootState} from '../';

import {errorMessage} from '../../api/client';
import {tipApi} from '../../api/tip';
import {toast} from '../../components/Toastify';
import type {ITipFeed} from '../../types/tip';
import {
  claimPass,
  explainTxError,
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
  fetchTiersRequest,
  fetchTipsRequest,
  mintArtifactRequest,
  refreshBalanceRequest,
  sendTipRequest,
} from '../actions';
import {setClaimed, setReveal, setTiers} from '../reducers/nft-slice';
import {setBalance} from '../reducers/wallet-slice';
import {setTipFeed, setTipsError, setTipsLoading} from '../reducers/tip-slice';
import {
  txBroadcast,
  txConfirmed,
  txFailed,
  txGasEstimated,
  txStarted,
  type ITxKind,
} from '../reducers/tx-slice';

/**
 * The wallet callbacks fire from inside ethers, outside the saga's own yields —
 * so they push their progress in through the store rather than returning it.
 * That is what lets the UI show "pending, here is your hash" while the chain is
 * still thinking.
 */
function* runTransaction<TResult>(
  kind: ITxKind,
  execute: (handlers: {
    onGasEstimated: (wei: string) => void;
    onBroadcast: (hash: string) => void;
  }) => Promise<TResult>,
): Generator<unknown, TResult | null, never> {
  const dispatched: {type: string; payload?: string}[] = [];

  yield put(txStarted(kind));

  try {
    const result = (yield call(execute, {
      onGasEstimated: (wei) => dispatched.push(txGasEstimated(wei)),
      onBroadcast: (value) => dispatched.push(txBroadcast(value)),
    })) as TResult;

    // Replay whatever ethers reported while we were awaiting it.
    for (const action of dispatched) {
      yield put(action);
    }

    yield put(txConfirmed());

    return result;
  } catch (error) {
    for (const action of dispatched) {
      yield put(action);
    }

    const message = explainTxError(error);

    yield put(txFailed(message));
    toast(message, message.includes('rejected') ? 'info' : 'error');

    return null;
  }
}

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
    yield put(setReveal({token: result.token, contract: result.contract, txHash: result.hash}));
  }

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
