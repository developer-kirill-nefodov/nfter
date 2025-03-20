import {JsonRpcProvider, Network} from 'ethers';

import {env} from '../config';

// staticNetwork tells ethers the chain id up front, so it never spends a round
// trip on eth_chainId before every call.
const network = Network.from(env.web3.chainId);

export const provider = new JsonRpcProvider(env.web3.rpcUrl, network, {
  staticNetwork: network,
  // ethers coalesces concurrent calls into a single JSON-RPC batch, and free
  // public tiers reject batches (drpc caps them at 3 and answers 500 for the
  // rest). One request per call is slower and is the only thing that works.
  batchMaxCount: 1,
});
