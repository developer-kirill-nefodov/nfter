import type {JsonRpcSigner} from 'ethers';

export const PASS_ADDRESS = import.meta.env.VITE_NFT_CONTRACT_ADDRESS;
export const TIP_JAR_ADDRESS = import.meta.env.VITE_TIP_JAR_ADDRESS;

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

/** The slice of ethers' TransactionResponse we actually use. */
export interface ITransactionResponse {
  hash: string;
  wait(confirmations?: number): Promise<{status: number | null; blockNumber: number} | null>;
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

export const explorerTx = (hash: string) => `https://sepolia.etherscan.io/tx/${hash}`;
export const explorerAddress = (address: string) =>
  `https://sepolia.etherscan.io/address/${address}`;
