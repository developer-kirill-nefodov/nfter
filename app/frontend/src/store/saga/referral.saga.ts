import {call, put, select, takeLatest} from 'redux-saga/effects';

import {referralApi} from '../../api/referral';
import type {IInviterEntry, IReferralStats, ITreasury} from '../../types/referral';
import {withdrawReferralEarnings} from '../../web3/transactions';
import {
  fetchInvitersRequest,
  fetchReferralsRequest,
  fetchTreasuryRequest,
  refreshBalanceRequest,
  withdrawReferralRequest,
} from '../actions';
import type {RootState} from '../';
import {setInviters, setReferralStats, setTreasury} from '../reducers/referral-slice';

import {runTransaction} from './run-transaction';

function* fetchReferralsSaga() {
  const signedIn: boolean = yield select(
    (state: RootState) => state.user.user.role.name !== 'VISITOR',
  );

  if (!signedIn) {
    yield put(setReferralStats(null));
    return;
  }

  try {
    const stats: IReferralStats = yield call(referralApi.me);
    yield put(setReferralStats(stats));
  } catch {
    // A transient fetch failure is not "you have no referral program". Overwriting with null wipes
    // the invite code, counts and the copy-link button, misleading the user — keep the last value.
  }
}

function* fetchInvitersSaga() {
  try {
    const entries: IInviterEntry[] = yield call(referralApi.inviters);
    yield put(setInviters(entries));
  } catch {
    yield put(setInviters([]));
  }
}

function* fetchTreasurySaga() {
  const founder: boolean = yield select((state: RootState) => state.user.user.isFounder === true);

  if (!founder) {
    yield put(setTreasury(null));
    return;
  }

  try {
    const treasury: ITreasury = yield call(referralApi.treasury);
    yield put(setTreasury(treasury));
  } catch {
    // Keep the last known treasury on a transient failure rather than blanking the whole page.
  }
}

function* withdrawReferralSaga() {
  const hash: string | null = yield call(
    runTransaction<string>,
    'withdraw',
    withdrawReferralEarnings,
    'Your referral earnings are in your wallet.',
  );

  if (hash) {
    yield put(fetchReferralsRequest());
    yield put(refreshBalanceRequest());
  }
}

export function* referralSaga() {
  yield takeLatest(fetchReferralsRequest.type, fetchReferralsSaga);
  yield takeLatest(fetchInvitersRequest.type, fetchInvitersSaga);
  yield takeLatest(fetchTreasuryRequest.type, fetchTreasurySaga);
  yield takeLatest(withdrawReferralRequest.type, withdrawReferralSaga);
}
