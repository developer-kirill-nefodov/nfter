import {call, put, takeLatest} from 'redux-saga/effects';

import {errorMessage} from '../../api/client';
import {tipApi} from '../../api/tip';
import {toast} from '../../components/Toastify';
import type {ITipFeed} from '../../types/tip';
import {
  claimPass,
  explainTxError,
  hasClaimed,
  mintArtifact,
  readTiers,
  sendTip,
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
  sendTipRequest,
} from '../actions';
import {setClaimed, setTiers} from '../reducers/nft-slice';
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
function* runTransaction(
  kind: ITxKind,
  execute: (handlers: {
    onGasEstimated: (wei: string) => void;
    onBroadcast: (hash: string) => void;
  }) => Promise<string>,
) {
  const dispatched: {type: string; payload?: string}[] = [];

  yield put(txStarted(kind));

  try {
    const hash: string = yield call(execute, {
      onGasEstimated: (wei) => dispatched.push(txGasEstimated(wei)),
      onBroadcast: (value) => dispatched.push(txBroadcast(value)),
    });

    // Replay whatever ethers reported while we were awaiting it.
    for (const action of dispatched) {
      yield put(action);
    }

    yield put(txConfirmed());

    return hash;
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
  const hash: string | null = yield call(runTransaction, 'claim', claimPass);

  if (hash) {
    yield put(setClaimed(true));
    // The gallery is cached server-side; ask for a fresh read now that the pass
    // actually exists on chain.
    yield put(fetchNftsRequest({refresh: true}));
    toast('Your pass is minted.', 'success');
  }
}

function* sendTipSaga({payload}: ReturnType<typeof sendTipRequest>) {
  const hash: string | null = yield call(runTransaction, 'tip', (handlers) =>
    sendTip(BigInt(payload.amountWei), payload.message, handlers),
  );

  if (hash) {
    yield put(fetchTipsRequest({refresh: true}));
    toast('Thank you — your tip is on chain.', 'success');
  }
}

function* mintArtifactSaga({payload}: ReturnType<typeof mintArtifactRequest>) {
  const hash: string | null = yield call(runTransaction, 'mint', (handlers) =>
    mintArtifact(payload, handlers),
  );

  if (hash) {
    yield put(fetchTiersRequest());
    yield put(fetchNftsRequest({refresh: true}));
    toast('Your artifact is minted.', 'success');
  }
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

export function* txSaga() {
  yield takeLatest(claimPassRequest.type, claimSaga);
  yield takeLatest(mintArtifactRequest.type, mintArtifactSaga);
  yield takeLatest(fetchTiersRequest.type, fetchTiersSaga);
  yield takeLatest(sendTipRequest.type, sendTipSaga);
  yield takeLatest(checkClaimRequest.type, checkClaimSaga);
  yield takeLatest(fetchTipsRequest.type, fetchTipsSaga);
}
