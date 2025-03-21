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
  passesMinted: number;
  holders: number;
  tipsTotalEth: string;
  tipCount: number;
  showcase: IShowcaseItem[];
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
