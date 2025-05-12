import {describe, expect, it} from 'vitest';

import type {IListing, ISale} from '../types/market';
import {bookStats, splitOf} from '../utils/economics';

const listing = (priceEth: string): IListing => ({
  collection: '0xcollection',
  tokenId: '1',
  seller: '0xseller',
  price: '0',
  priceEth,
  name: 'Artifact',
  image: '',
  rarity: 'common',
});

const sale = (priceEth: string, feeEth: string): ISale => ({
  collection: '0xcollection',
  tokenId: '1',
  seller: '0xseller',
  buyer: '0xbuyer',
  priceEth,
  feeEth,
  txHash: '0xhash',
  blockNumber: 1,
});

describe('splitOf', () => {
  it('gives the seller everything but the fee, and the referrer a tenth of that fee', () => {
    const split = splitOf('sale', 250, 1_000);

    expect(split.seller).toBeCloseTo(97.5);
    expect(split.treasury).toBeCloseTo(2.25);
    expect(split.referrer).toBeCloseTo(0.25);
  });

  it('splits a mint between the treasury and the referrer only', () => {
    const split = splitOf('mint', 250, 1_000);

    expect(split.seller).toBe(0);
    expect(split.treasury).toBeCloseTo(90);
    expect(split.referrer).toBeCloseTo(10);
  });

  it('always accounts for the whole payment', () => {
    for (const mode of ['sale', 'mint'] as const) {
      const {seller, treasury, referrer} = splitOf(mode, 250, 1_000);

      expect(seller + treasury + referrer).toBeCloseTo(100);
    }
  });
});

describe('bookStats', () => {
  it('reads the floor from the cheapest listing, not the first', () => {
    const stats = bookStats([listing('0.05'), listing('0.01'), listing('0.2')], []);

    expect(stats.listed).toBe(3);
    expect(stats.floor).toBe(0.01);
  });

  it('has no floor when nothing is for sale', () => {
    expect(bookStats([], []).floor).toBeNull();
  });

  it('adds up volume and fees across sales', () => {
    const stats = bookStats([], [sale('0.1', '0.0025'), sale('0.3', '0.0075')]);

    expect(stats.sold).toBe(2);
    expect(stats.volume).toBeCloseTo(0.4);
    expect(stats.fees).toBeCloseTo(0.01);
  });
});
