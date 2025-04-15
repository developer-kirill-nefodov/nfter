import {describe, expect, it} from 'vitest';

import statsReducer, {
  clearHighlight,
  setStats,
  showcaseMinted,
} from '../store/reducers/stats-slice';
import type {IPublicStats, IShowcaseItem} from '../types/stats';

const item = (tokenId: string): IShowcaseItem => ({
  tokenId,
  minter: '0x858C3223640000000000000000000000000000ab',
  name: `EthersWeb3 Artifact #${tokenId}`,
  image: 'data:image/svg+xml;base64,PHN2Zy8+',
  rarity: 'Legendary',
});

const stats = (showcase: IShowcaseItem[]): IPublicStats => ({
  chainId: 11155111,
  passContract: '0xpass',
  tipJarContract: '0xjar',
  artifactsContract: '0xart',
  passesMinted: 2,
  artifactsMinted: showcase.length,
  holders: 2,
  tipsTotalEth: '0.011',
  tipCount: 2,
  showcase: [],
  artifactShowcase: showcase,
  deployed: true,
});

describe('the shop window after a mint', () => {
  it('puts the new token at the front immediately', () => {
    const loaded = statsReducer(undefined, setStats(stats([item('5')])));
    const minted = statsReducer(loaded, showcaseMinted(item('6')));

    expect(minted.stats?.artifactShowcase[0]?.tokenId).toBe('6');
    expect(minted.highlight).toBe('6');
  });

  it('survives the refetch that the server answers from a stale index', () => {
    const loaded = statsReducer(undefined, setStats(stats([item('5')])));
    const minted = statsReducer(loaded, showcaseMinted(item('6')));

    // The indexer runs every 30 seconds, so the API genuinely does not know
    // about token 6 yet. Answering with the old list must not delete the card
    // the buyer just paid for — that was the bug.
    const refetched = statsReducer(minted, setStats(stats([item('5')])));

    expect(refetched.stats?.artifactShowcase.map((i) => i.tokenId)).toEqual(['6', '5']);
    expect(refetched.highlight).toBe('6');
  });

  it('hands over to the server once it has caught up', () => {
    const loaded = statsReducer(undefined, setStats(stats([item('5')])));
    const minted = statsReducer(loaded, showcaseMinted(item('6')));

    const caughtUp = statsReducer(minted, setStats(stats([item('6'), item('5')])));

    expect(caughtUp.justMinted).toBeNull();
    expect(caughtUp.stats?.artifactShowcase.map((i) => i.tokenId)).toEqual(['6', '5']);
  });

  it('keeps the card, but drops the marker, once the highlight expires', () => {
    const loaded = statsReducer(undefined, setStats(stats([item('5')])));
    const minted = statsReducer(loaded, showcaseMinted(item('6')));

    const later = statsReducer(minted, clearHighlight());

    expect(later.highlight).toBeNull();
    expect(later.stats?.artifactShowcase[0]?.tokenId).toBe('6');
  });
});
