export interface INftAttribute {
  trait_type: string;
  value: string | number;
}

export interface INft {
  tokenId: string;
  tokenUri: string;
  name: string;
  description: string;
  image: string;
  attributes: INftAttribute[];
}

export interface INftCollection {
  contract: string;
  chainId: number;
  name: string;
  symbol: string;
  balance: number;
  items: INft[];
}

/** Every collection this wallet holds, plus its native balance. */
export interface IWalletHoldings {
  owner: string;
  nativeBalance: string;
  collections: INftCollection[];
}
