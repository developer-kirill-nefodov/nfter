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
