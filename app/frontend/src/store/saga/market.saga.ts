import {call, delay, put, select, takeLatest} from 'redux-saga/effects';

import {errorMessage} from '../../api/client';
import {marketApi} from '../../api/market';
import type {IListing, IMarket} from '../../types/market';
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
import {
  listingAdded,
  listingKey,
  listingRemoved,
  listingSettled,
  setMarket,
  setMarketError,
  setMarketLoading,
  setProceeds,
} from '../reducers/market-slice';

import {resolveReferrer} from './referrer';
import {runTransaction} from './run-transaction';

/**
 * The server's book is built from indexed events, so it trails the chain by up to an indexer tick.
 * A transaction we watched confirm is therefore routinely absent from the very next answer. Ask
 * again, with a widening gap, until the server sees what the chain already told us.
 */
const SETTLE_DELAYS_MS = [800, 1_500, 3_000, 5_000, 8_000, 12_000];

function* settleMarket(token: {collection: string; tokenId: string}, listed: boolean) {
  const key = listingKey(token.collection, token.tokenId);

  try {
    for (const wait of SETTLE_DELAYS_MS) {
      yield delay(wait);

      try {
        const book: IMarket = yield call(marketApi.book, true);

        yield put(setMarket(book));

        const present = book.listings.some(
          ({collection, tokenId}) => listingKey(collection, tokenId) === key,
        );

        if (present === listed) {
          return;
        }
      } catch {
        // A failed poll is not a failed transaction. The chain already confirmed it; keep the
        // optimistic card on screen and try the server again.
      }
    }
  } finally {
    // Always stop overriding the server once we're done, whether we confirmed the change or ran out
    // of tries. Leaving `pending` set would let reconcile resurrect this card indefinitely — a
    // listing that was sold or cancelled between our poll attempts would otherwise reappear forever.
    yield put(listingSettled(token));
  }
}

// Match ethers' formatEther exactly (the backend uses it), so the optimistic card's price does not
// visibly flip — e.g. "1" → "1.0" — when reconcile swaps in the server listing.
const weiToEth = (wei: string): string => {
  const padded = wei.padStart(19, '0');
  const whole = padded.slice(0, -18);
  const fraction = padded.slice(-18).replace(/0+$/, '');

  return `${whole}.${fraction || '0'}`;
};

function* optimisticListing(collection: string, tokenId: string, priceWei: string) {
  const state: RootState = yield select();

  const nft = (state.nft.holdings?.collections ?? [])
    .find(({contract}) => contract.toLowerCase() === collection.toLowerCase())
    ?.items.find((item) => item.tokenId === tokenId);

  const listing: IListing = {
    collection,
    tokenId,
    seller: state.user.user.walletAddress ?? '',
    price: priceWei,
    priceEth: weiToEth(priceWei),
    name: nft?.name ?? `#${tokenId}`,
    image: nft?.image ?? '',
    // Artifacts carry a 'Tier' trait, Passes carry 'Rarity' — check both, as the backend does, so a
    // Pass listing does not flash a blank rarity before the server reconciles.
    rarity: String(
      nft?.attributes?.find(
        ({trait_type}) => trait_type === 'Tier' || trait_type === 'Rarity',
      )?.value ?? '',
    ),
  };

  yield put(listingAdded(listing));
}

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
    // A flaky RPC read is not proof of zero proceeds. Writing '0' here permanently hides the
    // Withdraw panel and strands the seller's money; leave the last known value untouched instead.
  }
}

function* listTokenSaga({payload}: ReturnType<typeof listTokenRequest>) {
  const hash: string | null = yield call(
    runTransaction<string>,
    'list',
    (handlers) => listToken(payload.collection, payload.tokenId, BigInt(payload.priceWei), handlers),
    'Your token is on sale.',
  );

  if (!hash) {
    return;
  }

  yield call(optimisticListing, payload.collection, payload.tokenId, payload.priceWei);

  yield put(refreshBalanceRequest());
  yield call(settleMarket, {collection: payload.collection, tokenId: payload.tokenId}, true);
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

  if (!hash) {
    return;
  }

  yield put(listingRemoved({collection: payload.collection, tokenId: payload.tokenId}));

  yield put(fetchNftsRequest({refresh: true}));
  yield put(refreshBalanceRequest());
  yield call(settleMarket, {collection: payload.collection, tokenId: payload.tokenId}, false);
}

function* cancelListingSaga({payload}: ReturnType<typeof cancelListingRequest>) {
  const hash: string | null = yield call(
    runTransaction<string>,
    'cancel',
    (handlers) => cancelListing(payload.collection, payload.tokenId, handlers),
    'Listing taken down.',
  );

  if (!hash) {
    return;
  }

  yield put(listingRemoved({collection: payload.collection, tokenId: payload.tokenId}));

  yield call(settleMarket, {collection: payload.collection, tokenId: payload.tokenId}, false);
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
