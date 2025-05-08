export interface IShowcaseItem {
  tokenId: string;
  minter: string;
  name: string;
  image: string;
  rarity: string;
}

export interface IPublicStats {
  chainId: number;
  passContract: string;
  tipJarContract: string;
  artifactsContract: string;
  passesMinted: number;
  artifactsMinted: number;
  holders: number;
  tipsTotalEth: string;
  tipCount: number;
  showcase: IShowcaseItem[];
  artifactShowcase: IShowcaseItem[];
  deployed: boolean;
}

export interface ILeaderboardEntry {
  rank: number;
  address: string;
  totalWei: string;
  totalEth: string;
  tips: number;
  lastMessage: string;
}

export interface ICollectorEntry {
  rank: number;
  address: string;
  tokens: number;
  passes: number;
  artifacts: number;
  spentWei: string;
  spentEth: string;
  bestTier: string;
}

export type IActivityKind = 'artifact' | 'pass' | 'tip';

export interface IActivityItem {
  kind: IActivityKind;
  actor: string;
  tokenId?: string;
  tier?: string;
  priceEth?: string;
  amountEth?: string;
  message?: string;
  txHash: string;
  blockNumber: number;
}
