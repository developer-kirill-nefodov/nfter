export interface IListing {
  collection: string;
  tokenId: string;
  seller: string;
  price: string;
  priceEth: string;
  name: string;
  image: string;
  rarity: string;
}

export interface ISale {
  collection: string;
  tokenId: string;
  seller: string;
  buyer: string;
  priceEth: string;
  feeEth: string;
  txHash: string;
  blockNumber: number;
}

export interface IMarket {
  contract: string;
  feeBps: number;
  listings: IListing[];
  sales: ISale[];
}
