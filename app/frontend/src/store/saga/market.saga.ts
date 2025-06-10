import {call, put, select, takeLatest} from 'redux-saga/effects';

import {errorMessage} from '../../api/client';
import {marketApi} from '../../api/market';
import type {IMarket} from '../../types/market';
import {
  buyListing,
  cancelListing,
  listToken,
  readProceeds,
  withdrawProceeds,
} from '../../web3/transactions';
import type {RootState} from '../';
import {
  buyListingRequest,
  cancelListingRequest,
  fetchMarketRequest,
  fetchNftsRequest,
  fetchProceedsRequest,
  listTokenRequest,
  refreshBalanceRequest,
  withdrawProceedsRequest,
} from '../actions';
import {setMarket, setMarketError, setMarketLoading, setProceeds} from '../reducers/market-slice';

import {resolveReferrer} from './referrer';
import {runTransaction} from './run-transaction';

function* fetchMarketSaga({payload}: ReturnType<typeof fetchMarketRequest>) {
  yield put(setMarketLoading(true));

  try {
    const book: IMarket = yield call(marketApi.book, payload?.refresh ?? false);
    yield put(setMarket(book));
  } catch (error) {
    yield put(setMarketError(errorMessage(error, 'Could not load the market')));
  }
}

function* fetchProceedsSaga() {
  try {
    const wallet: string | null = yield select(
      (state: RootState) => state.user.user.walletAddress,
    );

    if (wallet) {
      const amount: string = yield call(readProceeds, wallet);
      yield put(setProceeds(amount));
    }
  } catch {
    yield put(setProceeds('0'));
  }
}

function* listTokenSaga({payload}: ReturnType<typeof listTokenRequest>) {
  const hash: string | null = yield call(
    runTransaction<string>,
    'list',
    (handlers) => listToken(payload.collection, payload.tokenId, BigInt(payload.priceWei), handlers),
    'Your token is on sale.',
  );

  if (hash) {
    yield put(fetchMarketRequest({refresh: true}));
    yield put(refreshBalanceRequest());
  }
}

function* buyListingSaga({payload}: ReturnType<typeof buyListingRequest>) {
  const referrer: string = yield call(resolveReferrer);

  const hash: string | null = yield call(
    runTransaction<string>,
    'buy',
    (handlers) =>
      buyListing(payload.collection, payload.tokenId, BigInt(payload.priceWei), handlers, referrer),
    'Bought. It is yours.',
  );

  if (hash) {
    yield put(fetchMarketRequest({refresh: true}));
    yield put(fetchNftsRequest({refresh: true}));
    yield put(refreshBalanceRequest());
  }
}

function* cancelListingSaga({payload}: ReturnType<typeof cancelListingRequest>) {
  const hash: string | null = yield call(
    runTransaction<string>,
    'cancel',
    (handlers) => cancelListing(payload.collection, payload.tokenId, handlers),
    'Listing taken down.',
  );

  if (hash) {
    yield put(fetchMarketRequest({refresh: true}));
  }
}

function* withdrawSaga() {
  const hash: string | null = yield call(
    runTransaction<string>,
    'withdraw',
    withdrawProceeds,
    'Withdrawn to your wallet.',
  );

  if (hash) {
    yield put(fetchProceedsRequest());
    yield put(refreshBalanceRequest());
  }
}

export function* marketSaga() {
  yield takeLatest(fetchMarketRequest.type, fetchMarketSaga);
  yield takeLatest(fetchProceedsRequest.type, fetchProceedsSaga);
  yield takeLatest(listTokenRequest.type, listTokenSaga);
  yield takeLatest(buyListingRequest.type, buyListingSaga);
  yield takeLatest(cancelListingRequest.type, cancelListingSaga);
  yield takeLatest(withdrawProceedsRequest.type, withdrawSaga);
}
