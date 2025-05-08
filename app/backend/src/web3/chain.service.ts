import {Contract, formatEther, formatUnits} from 'ethers';

import {env} from '../config';
import {redis} from '../db';
import {logger} from '../lib/logger';
import {IndexerStateModel} from '../models/chain-event.model';

import {ARTIFACTS_READ_ABI, MARKETPLACE_ABI, PASS_READ_ABI} from './abis';
import {provider} from './provider';

const CACHE_KEY = 'chain:status';
const CACHE_TTL_SEC = 20;

const TIERS = ['Common', 'Rare', 'Epic', 'Legendary'];

export interface IChainTier {
  tier: number;
  name: string;
  priceEth: string;
  minted: number;
  cap: number;
}

export interface IChainContract {
  name: string;
  address: string;
  lastBlock: number;
  lag: number;
}

export interface IChainStatus {
  chainId: number;
  blockNumber: number;
  gasGwei: string;
  online: boolean;
  feeBps: number;
  referralBps: number;
  fromBlock: number;
  contracts: IChainContract[];
  tiers: IChainTier[];
  passesMinted: number;
}

const artifacts = new Contract(env.web3.artifacts, ARTIFACTS_READ_ABI, provider) as unknown as {
  priceOf(tier: number): Promise<bigint>;
  mintedOf(tier: number): Promise<bigint>;
  remaining(tier: number): Promise<bigint>;
  REFERRAL_BPS(): Promise<bigint>;
};

const pass = new Contract(env.web3.nftContract, PASS_READ_ABI, provider) as unknown as {
  totalSupply(): Promise<bigint>;
};

const market = new Contract(env.web3.marketplace, MARKETPLACE_ABI, provider) as unknown as {
  quote(price: bigint): Promise<[bigint, bigint]>;
};

const CONTRACTS = [
  {name: 'EthersWeb3Pass', address: env.web3.nftContract},
  {name: 'EthersWeb3Artifacts', address: env.web3.artifacts},
  {name: 'TipJar', address: env.web3.tipJar},
  {name: 'Marketplace', address: env.web3.marketplace},
  {name: 'Referrals', address: env.web3.referrals},
];

const readStatus = async (): Promise<IChainStatus> => {
  const blockNumber = await provider.getBlockNumber();
  const fee = await provider.getFeeData();

  const cursors = await IndexerStateModel.findAll();
  const cursorOf = new Map(cursors.map((row) => [row.contract.toLowerCase(), row.last_block]));

  const tiers: IChainTier[] = [];

  for (let tier = 0; tier < TIERS.length; tier += 1) {
    const [price, minted, left] = await Promise.all([
      artifacts.priceOf(tier),
      artifacts.mintedOf(tier),
      artifacts.remaining(tier),
    ]);

    tiers.push({
      tier,
      name: TIERS[tier] ?? '',
      priceEth: formatEther(price),
      minted: Number(minted),
      cap: Number(minted) + Number(left),
    });
  }

  const [passesMinted, referralBps, [marketFee]] = await Promise.all([
    pass.totalSupply(),
    artifacts.REFERRAL_BPS(),
    market.quote(10_000n),
  ]);

  return {
    chainId: env.web3.chainId,
    blockNumber,
    gasGwei: formatUnits(fee.gasPrice ?? 0n, 'gwei'),
    online: true,
    feeBps: Number(marketFee),
    referralBps: Number(referralBps),
    fromBlock: env.web3.fromBlock,
    contracts: CONTRACTS.map(({name, address}) => {
      const lastBlock = cursorOf.get(address.toLowerCase()) ?? 0;

      return {
        name,
        address,
        lastBlock,
        lag: lastBlock === 0 ? 0 : Math.max(0, blockNumber - lastBlock),
      };
    }),
    tiers,
    passesMinted: Number(passesMinted),
  };
};

const offline = (): IChainStatus => ({
  chainId: env.web3.chainId,
  blockNumber: 0,
  gasGwei: '0',
  online: false,
  feeBps: 250,
  referralBps: 1_000,
  fromBlock: env.web3.fromBlock,
  contracts: CONTRACTS.map(({name, address}) => ({name, address, lastBlock: 0, lag: 0})),
  tiers: [],
  passesMinted: 0,
});

export const getChainStatus = async ({refresh = false} = {}): Promise<IChainStatus> => {
  if (!refresh) {
    const cached = await redis.get(CACHE_KEY);

    if (cached) {
      return JSON.parse(cached) as IChainStatus;
    }
  }

  let status: IChainStatus;

  try {
    status = await readStatus();
  } catch (err) {
    logger.warn({err}, 'chain status unreadable');
    status = offline();
  }

  await redis.setEx(CACHE_KEY, CACHE_TTL_SEC, JSON.stringify(status));

  return status;
};
