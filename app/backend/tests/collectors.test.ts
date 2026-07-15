import {getAddress} from 'ethers';
import {describe, expect, it} from 'vitest';

import {rankCollectors} from '../src/web3/collectors';

const A = '0x' + 'a'.repeat(40);
const B = '0x' + 'b'.repeat(40);
const PASS = '0x' + '1'.repeat(40);
const ARTS = '0x' + '2'.repeat(40);

const opts = {passContract: PASS, artifactsContract: ARTS};

const claims = [{args: {minter: A, tokenId: '1', seed: '0'}}];
const mints = [
  {args: {minter: A, tokenId: '1', tier: '3', price: '30000000000000000'}}, // legendary → 30
  {args: {minter: A, tokenId: '2', tier: '0', price: '1000000000000000'}}, //  common    → 1
  {args: {minter: B, tokenId: '3', tier: '2', price: '10000000000000000'}}, // epic       → 10
];

describe('rankCollectors', () => {
  it('sums rarity points per owner and ranks by them', () => {
    const board = rankCollectors(claims, mints, [], opts);

    expect(board).toHaveLength(2);

    // A: pass(1) + legendary(30) + common(1) = 32 across 3 tokens; B: epic(10) across 1.
    expect(board[0]).toMatchObject({
      address: getAddress(A),
      rank: 1,
      points: 32,
      tokens: 3,
      bestTier: 'Legendary',
    });
    expect(board[1]).toMatchObject({address: getAddress(B), rank: 2, points: 10, tokens: 1});
  });

  it('moves points and counts to the buyer after a marketplace sale', () => {
    const sales = [
      {args: {buyer: B, collection: ARTS, tokenId: '1', seller: A, price: '0', fee: '0'}}, // A → B: legendary
    ];

    const board = rankCollectors(claims, mints, sales, opts);

    // Now B holds epic(10) + legendary(30) = 40; A keeps pass(1) + common(1) = 2.
    expect(board[0]).toMatchObject({address: getAddress(B), rank: 1, points: 40, tokens: 2});
    expect(board[1]).toMatchObject({address: getAddress(A), rank: 2, points: 2, tokens: 2});
  });

  it('drops owners left with nothing and applies only the latest sale', () => {
    // A sells its only-counted-here token twice in order: A → B, then B → A. A ends up holding it.
    const single = [{args: {minter: A, tokenId: '9', tier: '3', price: '0'}}];
    const sales = [
      {args: {buyer: B, collection: ARTS, tokenId: '9', seller: A, price: '0', fee: '0'}},
      {args: {buyer: A, collection: ARTS, tokenId: '9', seller: B, price: '0', fee: '0'}},
    ];

    const board = rankCollectors([], single, sales, opts);

    expect(board).toHaveLength(1);
    expect(board[0]).toMatchObject({address: getAddress(A), points: 30, tokens: 1});
  });
});
