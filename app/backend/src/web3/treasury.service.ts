import {Contract, formatEther, getAddress} from 'ethers';

import {env} from '../config';
import {logger} from '../lib/logger';

import {OWNABLE_ABI} from './abis';
import {provider} from './provider';
import {getTreasuryAddress} from './referral.service';

export interface ITreasury {
  owner: string;
  artifacts: {contract: string; balanceEth: string};
  tipJar: {contract: string; balanceEth: string};
  marketplace: {contract: string; proceedsEth: string};
  referrals: {contract: string; balanceEth: string};
  totalEth: string;
}

const market = new Contract(
  env.web3.marketplace,
  [...OWNABLE_ABI, 'function proceeds(address) view returns (uint256)'],
  provider,
) as unknown as {proceeds(account: string): Promise<bigint>};

export const getTreasury = async (): Promise<ITreasury> => {
  const owner = await getTreasuryAddress();

  if (!owner) {
    throw new Error('Treasury owner is unreadable');
  }

  const [artifactsBalance, jarBalance, referralsBalance, marketProceeds] = await Promise.all([
    provider.getBalance(env.web3.artifacts),
    provider.getBalance(env.web3.tipJar),
    provider.getBalance(env.web3.referrals),
    market.proceeds(owner),
  ]);

  const total = artifactsBalance + jarBalance + marketProceeds;

  logger.debug({owner}, 'treasury read');

  return {
    owner: getAddress(owner),
    artifacts: {contract: env.web3.artifacts, balanceEth: formatEther(artifactsBalance)},
    tipJar: {contract: env.web3.tipJar, balanceEth: formatEther(jarBalance)},
    marketplace: {contract: env.web3.marketplace, proceedsEth: formatEther(marketProceeds)},
    referrals: {contract: env.web3.referrals, balanceEth: formatEther(referralsBalance)},
    totalEth: formatEther(total),
  };
};
