import {call, put, takeLatest} from 'redux-saga/effects';

import {statsApi} from '../../api/stats';
import type {ILeaderboardEntry, IPublicStats} from '../../types/stats';
import {fetchLeaderboardRequest, fetchStatsRequest} from '../actions';
import {setLeaderboard, setStats, setStatsLoaded} from '../reducers/stats-slice';

function* fetchStatsSaga() {
  try {
    const stats: IPublicStats = yield call(statsApi.public);
    yield put(setStats(stats));
  } catch {
    // The landing page renders with zeros rather than not rendering at all.
    yield put(setStatsLoaded());
  }
}

function* fetchLeaderboardSaga() {
  try {
    const entries: ILeaderboardEntry[] = yield call(statsApi.leaderboard);
    yield put(setLeaderboard(entries));
  } catch {
    yield put(setLeaderboard([]));
  }
}

export function* statsSaga() {
  yield takeLatest(fetchStatsRequest.type, fetchStatsSaga);
  yield takeLatest(fetchLeaderboardRequest.type, fetchLeaderboardSaga);
}
