import type {BrowserProvider, JsonRpcSigner} from 'ethers';

export const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID);
export const CHAIN_NAME = import.meta.env.VITE_CHAIN_NAME;

export class WalletError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WalletError';
  }
}

const USER_REJECTED = 4001;
const REQUEST_PENDING = -32002;
const CHAIN_NOT_ADDED = 4902;

const codeOf = (error: unknown): number | undefined => {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }

  const {code, info} = error as {code?: number; info?: {error?: {code?: number}}};

  return info?.error?.code ?? (typeof code === 'number' ? code : undefined);
};

const isUserRejection = (error: unknown): boolean => codeOf(error) === USER_REJECTED;

export class WalletBusyError extends Error {
  constructor() {
    super('Your wallet already has a request open — unlock it and confirm there.');
    this.name = 'WalletBusyError';
  }
}

export const hasWallet = (): boolean => typeof window.ethereum !== 'undefined';

export const activeAccount = async (): Promise<string | null> => {
  if (!window.ethereum) {
    return null;
  }

  try {
    const accounts = (await window.ethereum.request({method: 'eth_accounts'})) as string[];

    return accounts[0] ?? null;
  } catch {
    return null;
  }
};

const getProvider = async (): Promise<BrowserProvider> => {
  if (!window.ethereum) {
    throw new WalletError('No Ethereum wallet found. Install MetaMask to continue.');
  }

  const {BrowserProvider} = await import('ethers');

  return new BrowserProvider(window.ethereum);
};

export interface IWalletConnection {
  address: string;
  chainId: number;
  signer: JsonRpcSigner;
}

export const connectWallet = async (): Promise<IWalletConnection> => {
  const provider = await getProvider();

  try {
    const signer = await provider.getSigner();
    const network = await provider.getNetwork();

    return {
      address: await signer.getAddress(),
      chainId: Number(network.chainId),
      signer,
    };
  } catch (error) {
    if (isUserRejection(error)) {
      throw new WalletError('Wallet connection was rejected.');
    }

    if (codeOf(error) === REQUEST_PENDING) {
      throw new WalletBusyError();
    }

    throw error;
  }
};

const SEPOLIA_PARAMS = {
  chainId: `0x${CHAIN_ID.toString(16)}`,
  chainName: CHAIN_NAME,
  nativeCurrency: {name: 'Sepolia Ether', symbol: 'ETH', decimals: 18},
  rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com'],
  blockExplorerUrls: ['https://sepolia.etherscan.io'],
};

export const switchChain = async (chainId: number = CHAIN_ID): Promise<IWalletConnection> => {
  const provider = await getProvider();

  try {
    await provider.send('wallet_switchEthereumChain', [{chainId: `0x${chainId.toString(16)}`}]);
  } catch (error) {
    if (codeOf(error) === CHAIN_NOT_ADDED && chainId === CHAIN_ID) {
      try {
        await provider.send('wallet_addEthereumChain', [SEPOLIA_PARAMS]);
      } catch (addError) {
        throw isUserRejection(addError)
          ? new WalletError(`${CHAIN_NAME} was not added to your wallet.`)
          : addError;
      }
    } else if (isUserRejection(error)) {
      throw new WalletError(`Please switch your wallet to ${CHAIN_NAME} to continue.`);
    } else if (codeOf(error) === REQUEST_PENDING) {
      throw new WalletBusyError();
    } else {
      throw error;
    }
  }

  return connectWallet();
};

export const signMessage = async (signer: JsonRpcSigner, message: string): Promise<string> => {
  try {
    return await signer.signMessage(message);
  } catch (error) {
    if (isUserRejection(error)) {
      throw new WalletError('Signature request was rejected.');
    }

    if (codeOf(error) === REQUEST_PENDING) {
      throw new WalletBusyError();
    }

    throw error;
  }
};

export const revokeWalletAccess = async (): Promise<void> => {
  if (!window.ethereum) {
    return;
  }

  try {
    const provider = await getProvider();

    await provider.send('wallet_revokePermissions', [{eth_accounts: {}}]);
  } catch {
    return;
  }
};

export const formatAddress = (address: string): string =>
  `${address.slice(0, 6)}…${address.slice(-4)}`;

const WEI_PER_ETH = 10n ** 18n;

export const formatBalance = (wei: string, decimals = 4): string => {
  const value = BigInt(wei);
  const whole = value / WEI_PER_ETH;
  const fraction = ((value % WEI_PER_ETH) * 10n ** BigInt(decimals)) / WEI_PER_ETH;

  return `${whole}.${fraction.toString().padStart(decimals, '0')}`;
};
