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
  owner: string;
  contract: string;
  chainId: number;
  name: string;
  symbol: string;
  balance: number;
  items: INft[];
  /** Native ETH balance of the owner, in wei. */
  nativeBalance: string;
}
