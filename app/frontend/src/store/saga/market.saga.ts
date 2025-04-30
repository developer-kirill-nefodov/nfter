import {call, put, select, takeLatest} from 'redux-saga/effects';

import {errorMessage} from '../../api/client';
import {marketApi} from '../../api/market';
import {toast} from '../../components/Toastify/toast';
import type {IMarket} from '../../types/market';
import {NO_REFERRER} from '../../web3/contracts';
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
    // Nothing to show is a fine answer here.
  }
}

function* listTokenSaga({payload}: ReturnType<typeof listTokenRequest>) {
  const hash: string | null = yield call(runTransaction<string>, 'list', (handlers) =>
    listToken(payload.collection, payload.tokenId, BigInt(payload.priceWei), handlers),
  );

  if (hash) {
    // The indexer needs a moment; ask the contract itself in the meantime.
    yield put(fetchMarketRequest({refresh: true}));
    yield put(refreshBalanceRequest());
    toast('Your token is on sale.', 'success');
  }
}

function* buyListingSaga({payload}: ReturnType<typeof buyListingRequest>) {
  const referrer: string = yield select(
    (state: RootState) => state.referral.stats?.referredByAddress ?? NO_REFERRER,
  );

  const hash: string | null = yield call(runTransaction<string>, 'buy', (handlers) =>
    buyListing(payload.collection, payload.tokenId, BigInt(payload.priceWei), handlers, referrer),
  );

  if (hash) {
    yield put(fetchMarketRequest({refresh: true}));
    yield put(fetchNftsRequest({refresh: true}));
    yield put(refreshBalanceRequest());
    toast('Bought. It is yours.', 'success');
  }
}

function* cancelListingSaga({payload}: ReturnType<typeof cancelListingRequest>) {
  const hash: string | null = yield call(runTransaction<string>, 'cancel', (handlers) =>
    cancelListing(payload.collection, payload.tokenId, handlers),
  );

  if (hash) {
    yield put(fetchMarketRequest({refresh: true}));
    toast('Listing taken down.', 'success');
  }
}

function* withdrawSaga() {
  const hash: string | null = yield call(runTransaction<string>, 'withdraw', withdrawProceeds);

  if (hash) {
    yield put(fetchProceedsRequest());
    yield put(refreshBalanceRequest());
    toast('Withdrawn to your wallet.', 'success');
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
