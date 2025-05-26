import {call, put, select} from 'redux-saga/effects';

import {referralApi} from '../../api/referral';
import type {IReferralStats} from '../../types/referral';
import {NO_REFERRER} from '../../web3/contracts';
import type {RootState} from '../';
import {setReferralStats} from '../reducers/referral-slice';

export function* resolveReferrer(): Generator<unknown, string, never> {
  const known: string | null = yield select(
    (state: RootState) => state.referral.stats?.referredByAddress ?? null,
  );

  if (known) {
    return known;
  }

  const loaded: boolean = yield select((state: RootState) => state.referral.stats !== null);

  if (loaded) {
    return NO_REFERRER;
  }

  try {
    const stats: IReferralStats = yield call(referralApi.me);
    yield put(setReferralStats(stats));

    return stats.referredByAddress ?? NO_REFERRER;
  } catch {
    return NO_REFERRER;
  }
}
