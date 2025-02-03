/// <reference types="vite/client" />

import type {Eip1193Provider} from 'ethers';

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_CHAIN_ID: string;
  readonly VITE_CHAIN_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    // MetaMask injects a raw EIP-1193 provider. It is *not* an ethers
    // BrowserProvider — BrowserProvider is the wrapper you construct around it,
    // which is exactly what the old type declaration got backwards.
    ethereum?: Eip1193Provider & {
      on?: (event: string, handler: (...args: never[]) => void) => void;
      removeListener?: (event: string, handler: (...args: never[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}
