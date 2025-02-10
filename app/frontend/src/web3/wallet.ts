import type {BrowserProvider, JsonRpcSigner} from 'ethers';

export const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID);
export const CHAIN_NAME = import.meta.env.VITE_CHAIN_NAME;

export class WalletError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WalletError';
  }
}

/** EIP-1193: the user closed the modal or hit Reject. Not worth a red toast. */
export const USER_REJECTED = 4001;

const isUserRejection = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && (error as {code?: number}).code === USER_REJECTED;

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

    throw error;
  }
};

export const switchChain = async (chainId: number = CHAIN_ID): Promise<void> => {
  const provider = await getProvider();

  try {
    await provider.send('wallet_switchEthereumChain', [{chainId: `0x${chainId.toString(16)}`}]);
  } catch (error) {
    if (isUserRejection(error)) {
      throw new WalletError(`Please switch your wallet to ${CHAIN_NAME} to continue.`);
    }

    throw error;
  }
};

export const signMessage = async (signer: JsonRpcSigner, message: string): Promise<string> => {
  try {
    return await signer.signMessage(message);
  } catch (error) {
    if (isUserRejection(error)) {
      throw new WalletError('Signature request was rejected.');
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
