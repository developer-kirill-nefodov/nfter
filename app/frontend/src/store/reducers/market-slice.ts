import {createSlice, type PayloadAction} from '@reduxjs/toolkit';

import type {IListing, IMarket} from '../../types/market';

export interface IMarketState {
  book: IMarket | null;
  loading: boolean;
  error: string | null;
  proceeds: string | null;
  /**
   * What the chain has already confirmed but the server's book may not show yet. `true` means the
   * token is on sale, `false` means it is not. Until the server agrees, these win: the chain is the
   * fact, and the book is a cache of it that we know is behind.
   */
  pending: Record<string, boolean>;
}

const initialState: IMarketState = {
  book: null,
  loading: true,
  error: null,
  proceeds: null,
  pending: {},
};

export const listingKey = (collection: string, tokenId: string): string =>
  `${collection.toLowerCase()}-${tokenId}`;

const keyOf = ({collection, tokenId}: {collection: string; tokenId: string}) =>
  listingKey(collection, tokenId);

const reconcile = (state: IMarketState, book: IMarket): IMarket => {
  const fresh = new Set(book.listings.map(keyOf));

  // Once the server's answer matches what we already knew, the override has done its job. Dropping
  // it here is what stops a sold token from being propped up on screen forever by a stale `true`.
  for (const [key, listed] of Object.entries(state.pending)) {
    if (fresh.has(key) === listed) {
      delete state.pending[key];
    }
  }

  const listings = book.listings.filter((listing) => state.pending[keyOf(listing)] !== false);

  const held = (state.book?.listings ?? []).filter(
    (listing) => state.pending[keyOf(listing)] === true && !fresh.has(keyOf(listing)),
  );

  return {...book, listings: [...held, ...listings]};
};

export const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {
    setMarketLoading: (state, {payload}: PayloadAction<boolean>) => {
      state.loading = payload;
      state.error = null;
    },
    setMarket: (state, {payload}: PayloadAction<IMarket>) => {
      state.loading = false;
      state.error = null;
      state.book = reconcile(state, payload);
    },
    setMarketError: (state, {payload}: PayloadAction<string>) => {
      state.loading = false;
      state.error = payload;
    },
    setProceeds: (state, {payload}: PayloadAction<string>) => {
      state.proceeds = payload;
    },
    /** A `list` confirmed: show the card now, and hold it there until the server's book has it. */
    listingAdded: (state, {payload}: PayloadAction<IListing>) => {
      const key = keyOf(payload);
      const book = state.book ?? {contract: '', feeBps: 250, listings: [], sales: []};

      state.pending[key] = true;
      state.book = {
        ...book,
        listings: [payload, ...book.listings.filter((listing) => keyOf(listing) !== key)],
      };
    },
    /** A `cancel` or a `buy` confirmed: take the card down now, and keep it down. */
    listingRemoved: (state, {payload}: PayloadAction<{collection: string; tokenId: string}>) => {
      const key = keyOf(payload);

      state.pending[key] = false;

      if (state.book) {
        state.book.listings = state.book.listings.filter((listing) => keyOf(listing) !== key);
      }
    },
    /** The server's book agrees with the chain now; stop overriding it for this token. */
    listingSettled: (state, {payload}: PayloadAction<{collection: string; tokenId: string}>) => {
      delete state.pending[keyOf(payload)];
    },
  },
});

export const {
  setMarketLoading,
  setMarket,
  setMarketError,
  setProceeds,
  listingAdded,
  listingRemoved,
  listingSettled,
} = marketSlice.actions;

export default marketSlice.reducer;
