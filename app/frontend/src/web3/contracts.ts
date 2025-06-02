import type {ContractRunner} from 'ethers';

export const PASS_ADDRESS = import.meta.env.VITE_NFT_CONTRACT_ADDRESS;
export const TIP_JAR_ADDRESS = import.meta.env.VITE_TIP_JAR_ADDRESS;
export const ARTIFACTS_ADDRESS = import.meta.env.VITE_ARTIFACTS_ADDRESS;
export const MARKETPLACE_ADDRESS = import.meta.env.VITE_MARKETPLACE_ADDRESS;
export const REFERRALS_ADDRESS = import.meta.env.VITE_REFERRALS_ADDRESS;

export const NO_REFERRER = '0x0000000000000000000000000000000000000000';

export const REFERRALS_ABI = [
  'function withdraw()',
  'function earned(address) view returns (uint256)',
  'function referrerOf(address) view returns (address)',
];

export const MARKETPLACE_ABI = [
  'function list(address collection, uint256 tokenId, uint256 price)',
  'function cancel(address collection, uint256 tokenId)',
  'function buy(address collection, uint256 tokenId, address referrer) payable',
  'function withdraw()',
  'function proceeds(address) view returns (uint256)',
];

export const ERC721_APPROVAL_ABI = [
  'function setApprovalForAll(address operator, bool approved)',
  'function isApprovedForAll(address owner, address operator) view returns (bool)',
];

export type ITier = 0 | 1 | 2 | 3;

export const TIERS = [
  {id: 0 as ITier, key: 'common' as const, price: '0.001', cap: 1000},
  {id: 1 as ITier, key: 'rare' as const, price: '0.003', cap: 250},
  {id: 2 as ITier, key: 'epic' as const, price: '0.01', cap: 50},
  {id: 3 as ITier, key: 'legendary' as const, price: '0.03', cap: 10},
];

export const ARTIFACTS_ABI = [
  'function mint(uint8 tier, address referrer) payable returns (uint256)',
  'function priceOf(uint8 tier) view returns (uint256)',
  'function remaining(uint8 tier) view returns (uint256)',
  'event Minted(address indexed minter, uint256 indexed tokenId, uint8 tier, uint256 price, uint256 seed)',
];

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

export interface IMarketContract {
  list: IContractMethod<[collection: string, tokenId: string, price: bigint], ITransactionResponse>;
  cancel: IContractMethod<[collection: string, tokenId: string], ITransactionResponse>;
  buy: IContractMethod<
    [collection: string, tokenId: string, referrer: string, overrides: {value: bigint}],
    ITransactionResponse
  >;
  withdraw: IContractMethod<[], ITransactionResponse>;
  proceeds: IContractMethod<[account: string], bigint>;
}

export interface IApprovalContract {
  setApprovalForAll: IContractMethod<[operator: string, approved: boolean], ITransactionResponse>;
  isApprovedForAll: IContractMethod<[owner: string, operator: string], boolean>;
}

export interface IReferralsContract {
  withdraw: IContractMethod<[], ITransactionResponse>;
  earned: IContractMethod<[account: string], bigint>;
}

export interface IArtifactsContract {
  mint: IContractMethod<
    [tier: number, referrer: string, overrides: {value: bigint}],
    ITransactionResponse
  >;
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

export interface ITransactionResponse {
  hash: string;
  wait(confirmations?: number): Promise<ITxReceipt | null>;
}

export const getPass = async (runner: ContractRunner): Promise<IPassContract> => {
  const {Contract} = await import('ethers');

  return new Contract(PASS_ADDRESS, PASS_ABI, runner) as unknown as IPassContract;
};

export const getTipJar = async (runner: ContractRunner): Promise<ITipJarContract> => {
  const {Contract} = await import('ethers');

  return new Contract(TIP_JAR_ADDRESS, TIP_JAR_ABI, runner) as unknown as ITipJarContract;
};

export const getArtifacts = async (runner: ContractRunner): Promise<IArtifactsContract> => {
  const {Contract} = await import('ethers');

  return new Contract(ARTIFACTS_ADDRESS, ARTIFACTS_ABI, runner) as unknown as IArtifactsContract;
};

export const readToken = async (
  runner: ContractRunner,
  contract: string,
  tokenId: string,
): Promise<{tokenId: string; tokenUri: string; name: string; description: string; image: string; attributes: {trait_type: string; value: string | number}[]}> => {
  const {Contract} = await import('ethers');

  const erc721 = new Contract(contract, ['function tokenURI(uint256) view returns (string)'], runner);
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

export const getMarket = async (runner: ContractRunner): Promise<IMarketContract> => {
  const {Contract} = await import('ethers');

  return new Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, runner) as unknown as IMarketContract;
};

export const getApproval = async (
  runner: ContractRunner,
  collection: string,
): Promise<IApprovalContract> => {
  const {Contract} = await import('ethers');

  return new Contract(collection, ERC721_APPROVAL_ABI, runner) as unknown as IApprovalContract;
};

export const getReferrals = async (runner: ContractRunner): Promise<IReferralsContract> => {
  const {Contract} = await import('ethers');

  return new Contract(REFERRALS_ADDRESS, REFERRALS_ABI, runner) as unknown as IReferralsContract;
};

export const explorerTx = (hash: string) => `https://sepolia.etherscan.io/tx/${hash}`;
export const explorerAddress = (address: string) =>
  `https://sepolia.etherscan.io/address/${address}`;

export const explorerToken = (contract: string, tokenId: string) =>
  `https://sepolia.etherscan.io/nft/${contract}/${tokenId}`;
