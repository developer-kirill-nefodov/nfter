import {call, put, takeLatest} from 'redux-saga/effects';

import {errorMessage} from '../../api/client';
import {nftApi} from '../../api/nft';
import type {IWalletHoldings} from '../../types/nft';
import {fetchNftsRequest} from '../actions';
import {setNftCollection, setNftError, setNftLoading} from '../reducers/nft-slice';

function* fetchNftsSaga({payload}: ReturnType<typeof fetchNftsRequest>) {
  yield put(setNftLoading(true));

  try {
    const holdings: IWalletHoldings = yield call(nftApi.myCollection, payload?.refresh ?? false);
    yield put(setNftCollection(holdings));
  } catch (error) {
    yield put(setNftError(errorMessage(error, 'Could not load your collection')));
  }
}

export function* nftSaga() {
  yield takeLatest(fetchNftsRequest.type, fetchNftsSaga);
}
