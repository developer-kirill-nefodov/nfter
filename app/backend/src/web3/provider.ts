import {JsonRpcProvider, Network} from 'ethers';

import {env} from '../config';

const network = Network.from(env.web3.chainId);

export const provider = new JsonRpcProvider(env.web3.rpcUrl, network, {
  staticNetwork: network,
  batchMaxCount: 1,
});
