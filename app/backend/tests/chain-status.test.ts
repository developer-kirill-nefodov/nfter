import {beforeEach, describe, expect, it, vi} from 'vitest';

import {createRedisMock} from './redis-mock';

const redis = createRedisMock();

vi.mock('../src/db', () => ({redis, db: {}}));

const cursors: {contract: string; last_block: number}[] = [];

vi.mock('../src/models/chain-event.model', () => ({
  ChainEventModel: {},
  IndexerStateModel: {findAll: () => Promise.resolve(cursors)},
}));

const chain = {
  blockNumber: 11_000_000,
  gasPrice: 2_000_000_000n,
  priceOf: 1_000_000_000_000_000n,
  minted: 3n,
  remaining: 997n,
  referralBps: 1_000n,
  fee: 250n,
  passes: 7n,
};

vi.mock('../src/web3/provider', () => ({
  provider: {
    getBlockNumber: () => Promise.resolve(chain.blockNumber),
    getFeeData: () => Promise.resolve({gasPrice: chain.gasPrice}),
  },
}));

vi.mock('ethers', async () => {
  const actual = await vi.importActual<typeof import('ethers')>('ethers');

  class ContractMock {
    priceOf = () => Promise.resolve(chain.priceOf);
    mintedOf = () => Promise.resolve(chain.minted);
    remaining = () => Promise.resolve(chain.remaining);
    REFERRAL_BPS = () => Promise.resolve(chain.referralBps);
    totalSupply = () => Promise.resolve(chain.passes);
    quote = () => Promise.resolve([chain.fee, 9_750n]);
  }

  return {...actual, Contract: ContractMock};
});

const {getChainStatus} = await import('../src/web3/chain.service');
const {env} = await import('../src/config');

describe('getChainStatus', () => {
  beforeEach(() => {
    redis.store.clear();
    cursors.length = 0;
  });

  it('reports the head block, the gas price and the fees', async () => {
    const status = await getChainStatus({refresh: true});

    expect(status.online).toBe(true);
    expect(status.blockNumber).toBe(chain.blockNumber);
    expect(status.gasGwei).toBe('2.0');
    expect(status.feeBps).toBe(250);
    expect(status.referralBps).toBe(1_000);
    expect(status.passesMinted).toBe(7);
  });

  it('turns each tier into a supply the page can draw', async () => {
    const {tiers} = await getChainStatus({refresh: true});

    expect(tiers).toHaveLength(4);
    expect(tiers[0]).toMatchObject({name: 'Common', minted: 3, cap: 1_000, priceEth: '0.001'});
  });

  it('measures how far behind each contract the indexer is', async () => {
    cursors.push({contract: env.web3.artifacts.toLowerCase(), last_block: chain.blockNumber - 12});

    const {contracts} = await getChainStatus({refresh: true});

    const artifacts = contracts.find((item) => item.name === 'EthersWeb3Artifacts');
    const untouched = contracts.find((item) => item.name === 'TipJar');

    expect(artifacts?.lag).toBe(12);
    expect(untouched?.lag).toBe(0);
    expect(untouched?.lastBlock).toBe(0);
  });

  it('serves the cached answer until it expires', async () => {
    const first = await getChainStatus({refresh: true});

    chain.blockNumber = 11_000_500;

    const cached = await getChainStatus();

    expect(cached.blockNumber).toBe(first.blockNumber);

    const fresh = await getChainStatus({refresh: true});

    expect(fresh.blockNumber).toBe(11_000_500);
  });
});
