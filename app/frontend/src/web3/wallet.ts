import type {BrowserProvider, JsonRpcSigner} from 'ethers';

export const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID);
export const CHAIN_NAME = import.meta.env.VITE_CHAIN_NAME;

export class WalletError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WalletError';
  }
}

/** EIP-1193 error codes we can actually do something useful about. */
const USER_REJECTED = 4001;
const REQUEST_PENDING = -32002; // a prompt is already open, or the wallet is locked
const CHAIN_NOT_ADDED = 4902;

/** MetaMask nests the real code under `error.info.error` when it comes via RPC. */
const codeOf = (error: unknown): number | undefined => {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }

  const {code, info} = error as {code?: number; info?: {error?: {code?: number}}};

  return info?.error?.code ?? (typeof code === 'number' ? code : undefined);
};

const isUserRejection = (error: unknown): boolean => codeOf(error) === USER_REJECTED;

/**
 * A wallet that is locked, or already showing a prompt behind the browser
 * window, answers with -32002 rather than doing anything. Reported raw, that
 * reads as a crash; it is really an instruction to the user.
 */
export class WalletBusyError extends Error {
  constructor() {
    super('Your wallet already has a request open — unlock it and confirm there.');
    this.name = 'WalletBusyError';
  }
}

export const hasWallet = (): boolean => typeof window.ethereum !== 'undefined';

/**
 * ethers is ~900 kB — a third of everything we ship — and it is worth nothing to
 * a visitor who never touches a wallet. Importing it lazily, at the moment the
 * user actually clicks Connect, keeps it out of the initial download entirely.
 * Type-only imports above are erased at compile time and cost nothing.
 */
const getProvider = async (): Promise<BrowserProvider> => {
  if (!window.ethereum) {
    throw new WalletError('No Ethereum wallet found. Install MetaMask to continue.');
  }

  const {BrowserProvider} = await import('ethers');

  // A fresh instance per call: a cached one would still be holding the chain id
  // the user has since switched away from.
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
    // getSigner() is what triggers eth_requestAccounts, i.e. the MetaMask prompt.
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

/**
 * Switching returns a fresh signer: the old one is bound to the provider state
 * from before the switch, and signing with it can fail or sign for the wrong
 * chain. Reconnecting afterwards is cheap — the account is already authorised,
 * so it raises no second prompt.
 */
export const switchChain = async (chainId: number = CHAIN_ID): Promise<IWalletConnection> => {
  const provider = await getProvider();

  try {
    await provider.send('wallet_switchEthereumChain', [{chainId: `0x${chainId.toString(16)}`}]);
  } catch (error) {
    // 4902: the wallet has never heard of this chain. Offer to add it rather
    // than telling the user to go and configure a testnet by hand.
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

export const formatAddress = (address: string): string =>
  `${address.slice(0, 6)}…${address.slice(-4)}`;

const WEI_PER_ETH = 10n ** 18n;

/**
 * Wei → ETH without pulling in ethers' formatUnits: this runs in the header on
 * every render, and it is not worth 900 kB of bundle to divide by 1e18.
 */
export const formatBalance = (wei: string, decimals = 4): string => {
  const value = BigInt(wei);
  const whole = value / WEI_PER_ETH;
  const fraction = ((value % WEI_PER_ETH) * 10n ** BigInt(decimals)) / WEI_PER_ETH;

  return `${whole}.${fraction.toString().padStart(decimals, '0')}`;
};
