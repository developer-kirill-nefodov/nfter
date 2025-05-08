import {call, put, takeLatest} from 'redux-saga/effects';

import {chainApi} from '../../api/chain';
import type {IChainStatus} from '../../types/chain';
import {fetchChainRequest} from '../actions';
import {setChainLoading, setChainStatus} from '../reducers/chain-slice';

function* fetchChainSaga() {
  yield put(setChainLoading(true));

  try {
    const status: IChainStatus = yield call(chainApi.status);
    yield put(setChainStatus(status));
  } catch {
    yield put(setChainLoading(false));
  }
}

export function* chainSaga() {
  yield takeLatest(fetchChainRequest.type, fetchChainSaga);
}
