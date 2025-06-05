import {call, put, select, takeLatest} from 'redux-saga/effects';

import {referralApi} from '../../api/referral';
import {toast} from '../../components/Toastify/toast';
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
    yield put(setReferralStats(null));
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
    yield put(setTreasury(null));
  }
}

function* withdrawReferralSaga() {
  const hash: string | null = yield call(
    runTransaction<string>,
    'withdraw',
    withdrawReferralEarnings,
  );

  if (hash) {
    yield put(fetchReferralsRequest());
    yield put(refreshBalanceRequest());
    toast('Your referral earnings are in your wallet.', 'success');
  }
}

export function* referralSaga() {
  yield takeLatest(fetchReferralsRequest.type, fetchReferralsSaga);
  yield takeLatest(fetchInvitersRequest.type, fetchInvitersSaga);
  yield takeLatest(fetchTreasuryRequest.type, fetchTreasurySaga);
  yield takeLatest(withdrawReferralRequest.type, withdrawReferralSaga);
}
