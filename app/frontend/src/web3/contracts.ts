import type {JsonRpcSigner} from 'ethers';

export const PASS_ADDRESS = import.meta.env.VITE_NFT_CONTRACT_ADDRESS;
export const TIP_JAR_ADDRESS = import.meta.env.VITE_TIP_JAR_ADDRESS;
export const ARTIFACTS_ADDRESS = import.meta.env.VITE_ARTIFACTS_ADDRESS;

export type ITier = 0 | 1 | 2 | 3;

/** Mirrors the contract: prices and caps are immutable there, so they are here. */
export const TIERS = [
  {id: 0 as ITier, key: 'common' as const, price: '0.001', cap: 1000},
  {id: 1 as ITier, key: 'rare' as const, price: '0.003', cap: 250},
  {id: 2 as ITier, key: 'epic' as const, price: '0.01', cap: 50},
  {id: 3 as ITier, key: 'legendary' as const, price: '0.03', cap: 10},
];

export const ARTIFACTS_ABI = [
  'function mint(uint8 tier) payable returns (uint256)',
  'function priceOf(uint8 tier) view returns (uint256)',
  'function remaining(uint8 tier) view returns (uint256)',
  'event Minted(address indexed minter, uint256 indexed tokenId, uint8 tier, uint256 price, uint256 seed)',
];

/** Only the fragments this app calls. A full ABI would be dead weight in the bundle. */
export const PASS_ABI = [
  'function claim() returns (uint256)',
  'function claimed(address) view returns (bool)',
  'function totalMinted() view returns (uint256)',
  'event Claimed(address indexed minter, uint256 indexed tokenId, uint256 seed)',
];

export const TIP_JAR_ABI = [
  'function tip(string message) payable',
  'function owner() view returns (address)',
  'function tipCount() view returns (uint256)',
  'event Tipped(address indexed from, uint256 amount, string message, uint256 timestamp)',
];

/**
 * ethers types contract methods through an index signature, so a struct that
 * `extends Contract` cannot also name them. Describing just the calls we make —
 * each with its `estimateGas` twin — gives real types at the call sites.
 */
interface IContractMethod<TArgs extends unknown[], TResult> {
  (...args: TArgs): Promise<TResult>;
  estimateGas(...args: TArgs): Promise<bigint>;
}

export interface IPassContract {
  claim: IContractMethod<[], ITransactionResponse>;
  claimed: IContractMethod<[wallet: string], boolean>;
}

export interface ITipJarContract {
  tip: IContractMethod<[message: string, overrides: {value: bigint}], ITransactionResponse>;
}

export interface IArtifactsContract {
  mint: IContractMethod<[tier: number, overrides: {value: bigint}], ITransactionResponse>;
  priceOf: IContractMethod<[tier: number], bigint>;
  remaining: IContractMethod<[tier: number], bigint>;
}

export interface ITxLog {
  topics: readonly string[];
  data: string;
  address: string;
}

export interface ITxReceipt {
  status: number | null;
  blockNumber: number;
  logs: readonly ITxLog[];
}

/** The slice of ethers' TransactionResponse we actually use. */
export interface ITransactionResponse {
  hash: string;
  wait(confirmations?: number): Promise<ITxReceipt | null>;
}

/**
 * ethers is imported lazily everywhere in this app — it is the heaviest thing we
 * ship and it is worth nothing to a visitor who never opens a wallet.
 */
export const getPass = async (signer: JsonRpcSigner): Promise<IPassContract> => {
  const {Contract} = await import('ethers');

  return new Contract(PASS_ADDRESS, PASS_ABI, signer) as unknown as IPassContract;
};

export const getTipJar = async (signer: JsonRpcSigner): Promise<ITipJarContract> => {
  const {Contract} = await import('ethers');

  return new Contract(TIP_JAR_ADDRESS, TIP_JAR_ABI, signer) as unknown as ITipJarContract;
};

export const getArtifacts = async (signer: JsonRpcSigner): Promise<IArtifactsContract> => {
  const {Contract} = await import('ethers');

  return new Contract(ARTIFACTS_ADDRESS, ARTIFACTS_ABI, signer) as unknown as IArtifactsContract;
};

/** Reads one token's metadata straight off the chain, decoding the data: URI. */
export const readToken = async (
  signer: JsonRpcSigner,
  contract: string,
  tokenId: string,
): Promise<{tokenId: string; tokenUri: string; name: string; description: string; image: string; attributes: {trait_type: string; value: string | number}[]}> => {
  const {Contract} = await import('ethers');

  const erc721 = new Contract(contract, ['function tokenURI(uint256) view returns (string)'], signer);
  const tokenUri = (await erc721.tokenURI!(tokenId)) as string;

  const payload = tokenUri.slice(tokenUri.indexOf(',') + 1);
  const json = JSON.parse(atob(payload)) as {
    name: string;
    description: string;
    image: string;
    attributes: {trait_type: string; value: string | number}[];
  };

  return {tokenId, tokenUri, ...json};
};

export const explorerTx = (hash: string) => `https://sepolia.etherscan.io/tx/${hash}`;
export const explorerAddress = (address: string) =>
  `https://sepolia.etherscan.io/address/${address}`;

export const explorerToken = (contract: string, tokenId: string) =>
  `https://sepolia.etherscan.io/nft/${contract}/${tokenId}`;
