import {describe, expect, it} from 'vitest';

import walletReducer, {
  disconnectWallet,
  setChainId,
  setWallet,
  setWalletError,
  setWalletStatus,
} from '../store/reducers/wallet-slice';
import {formatAddress, formatBalance} from '../web3/wallet';

const ADDRESS = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';

describe('wallet formatting', () => {
  it('shortens an address without losing either end', () => {
    expect(formatAddress(ADDRESS)).toBe('0x71C7…976F');
  });

  it('converts wei to ETH', () => {
    expect(formatBalance('1000000000000000000')).toBe('1.0000');
    expect(formatBalance('1234500000000000000')).toBe('1.2345');
    expect(formatBalance('0')).toBe('0.0000');
  });

  it('truncates rather than rounding up, so a balance is never overstated', () => {
    expect(formatBalance('999999999999999999')).toBe('0.9999');
  });
});

describe('wallet slice', () => {
  it('starts disconnected', () => {
    const state = walletReducer(undefined, {type: 'init'});

    expect(state).toEqual({address: null, chainId: null, status: 'disconnected', error: null});
  });

  it('clears a stale error as soon as a new attempt starts', () => {
    const failed = walletReducer(undefined, setWalletError('Signature rejected'));
    const retrying = walletReducer(failed, setWalletStatus('connecting'));

    expect(failed.error).toBe('Signature rejected');
    expect(retrying.error).toBeNull();
  });

  it('records the address and chain on connect', () => {
    const state = walletReducer(undefined, setWallet({address: ADDRESS, chainId: 11155111}));

    expect(state).toMatchObject({address: ADDRESS, chainId: 11155111, status: 'connected'});
  });

  it('tracks a chain switch without dropping the connection', () => {
    const connected = walletReducer(undefined, setWallet({address: ADDRESS, chainId: 11155111}));
    const switched = walletReducer(connected, setChainId(1));

    expect(switched.chainId).toBe(1);
    expect(switched.status).toBe('connected');
  });

  it('resets completely on disconnect', () => {
    const connected = walletReducer(undefined, setWallet({address: ADDRESS, chainId: 11155111}));

    expect(walletReducer(connected, disconnectWallet()).address).toBeNull();
  });
});
