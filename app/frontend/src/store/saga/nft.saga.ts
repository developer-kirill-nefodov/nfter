import {call, put, takeLatest} from 'redux-saga/effects';

import {errorMessage} from '../../api/client';
import {nftApi} from '../../api/nft';
import type {INftCollection} from '../../types/nft';
import {fetchNftsRequest} from '../actions';
import {setNftCollection, setNftError, setNftLoading} from '../reducers/nft-slice';

function* fetchNftsSaga({payload}: ReturnType<typeof fetchNftsRequest>) {
  yield put(setNftLoading(true));

  try {
    const collection: INftCollection = yield call(nftApi.myCollection, payload?.refresh ?? false);
    yield put(setNftCollection(collection));
  } catch (error) {
    yield put(setNftError(errorMessage(error, 'Could not load your collection')));
  }
}

export function* nftSaga() {
  yield takeLatest(fetchNftsRequest.type, fetchNftsSaga);
}
