import type {JsonRpcProvider} from 'ethers';

import {CHAIN_ID} from './wallet';

const RPC_URL = (import.meta.env.VITE_RPC_URL as string | undefined) ?? 'https://sepolia.drpc.org';

let provider: Promise<JsonRpcProvider> | null = null;

export const readProvider = async (): Promise<JsonRpcProvider> => {
  provider ??= (async () => {
    const {JsonRpcProvider, Network} = await import('ethers');
    const network = Network.from(CHAIN_ID);

    return new JsonRpcProvider(RPC_URL, network, {staticNetwork: network, batchMaxCount: 1});
  })();

  return provider;
};
