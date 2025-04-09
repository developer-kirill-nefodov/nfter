import type {JsonRpcSigner} from 'ethers';

import {
  ARTIFACTS_ADDRESS,
  PASS_ADDRESS,
  getArtifacts,
  getPass,
  getTipJar,
  readToken,
  TIERS,
  type ITier,
  type ITransactionResponse,
  type ITxReceipt,
} from './contracts';
import {CHAIN_NAME, WalletError, connectWallet} from './wallet';

/**
 * Did the user simply say no?
 *
 * That is a decision, not a failure, and the two deserve different treatment:
 * a rejection can disappear on its own, a real error has to be read.
 */
export const isRejection = (error: unknown): boolean => {
  if (error instanceof WalletError) {
    return /reject/i.test(error.message);
  }

  const {code, message, shortMessage} = (error ?? {}) as {
    code?: string | number;
    message?: string;
    shortMessage?: string;
  };

  return (
    code === 'ACTION_REJECTED' ||
    code === 4001 ||
    /user rejected|rejected the request/i.test(`${shortMessage ?? ''} ${message ?? ''}`)
  );
};

/**
 * Turns whatever the wallet or the node threw into a sentence a person can act
 * on. Raw provider errors are the single worst part of using a dapp: nobody
 * should be shown "execution reverted (unknown custom error)".
 */
export const explainTxError = (error: unknown): string => {
  if (error instanceof WalletError) {
    return error.message;
  }

  const {code, shortMessage, message} = (error ?? {}) as {
    code?: string | number;
    shortMessage?: string;
    message?: string;
  };

  if (code === 'ACTION_REJECTED' || code === 4001) {
    return 'You rejected the transaction.';
  }

  if (code === 'INSUFFICIENT_FUNDS') {
    return `Not enough ETH to cover the amount plus gas. Top up on ${CHAIN_NAME}.`;
  }

  const text = `${shortMessage ?? ''} ${message ?? ''}`;

  if (/SoldOut/i.test(text)) {
    return 'That tier is sold out — the cap is enforced by the contract.';
  }

  if (/WrongPrice/i.test(text)) {
    return 'The price changed under you. Reload and try again.';
  }

  if (/AlreadyClaimed/i.test(text)) {
    return 'This wallet has already claimed its pass — one per wallet, forever.';
  }

  if (/EmptyTip/i.test(text)) {
    return 'A tip has to be more than zero.';
  }

  if (/MessageTooLong/i.test(text)) {
    return 'That message is longer than the contract will accept (140 characters).';
  }

  if (/user rejected|rejected the request/i.test(text)) {
    return 'You rejected the transaction.';
  }

  return shortMessage || message || 'The transaction failed.';
};

export interface ITxHandlers {
  onGasEstimated: (weiCost: string) => void;
  onBroadcast: (hash: string) => void;
}

/** The signer the wallet is holding right now — never a cached, stale one. */
const currentSigner = async (): Promise<JsonRpcSigner> => (await connectWallet()).signer;

/**
 * Prices the call, sends it, and waits for one confirmation.
 *
 * The gas estimate is deliberately taken *before* the wallet is opened: a user
 * deserves to know what a transaction costs while they can still walk away,
 * rather than discovering it in a MetaMask popup. It doubles as a dry run — a
 * call that would revert fails here, with a real reason, and never reaches the
 * wallet at all.
 */
const send = async (
  estimate: () => Promise<bigint>,
  execute: () => Promise<ITransactionResponse>,
  {onGasEstimated, onBroadcast}: ITxHandlers,
  gasPrice: bigint,
): Promise<{hash: string; receipt: ITxReceipt}> => {
  const gas = await estimate();

  onGasEstimated((gas * gasPrice).toString());

  const tx = await execute();

  onBroadcast(tx.hash);

  const receipt = await tx.wait(1);

  if (!receipt || receipt.status === 0) {
    throw new Error('The transaction was mined but reverted.');
  }

  return {hash: tx.hash, receipt};
};

/**
 * Pulls the new token id out of the receipt.
 *
 * Not out of the gallery: that is cached server-side and, at the moment the mint
 * confirms, does not know the token exists yet. The receipt is the only place the
 * answer is already true.
 */
const mintedTokenId = async (receipt: ITxReceipt, contract: string): Promise<string | null> => {
  const {Interface} = await import('ethers');

  const iface = new Interface([
    'event Minted(address indexed minter, uint256 indexed tokenId, uint8 tier, uint256 price, uint256 seed)',
    'event Claimed(address indexed minter, uint256 indexed tokenId, uint256 seed)',
  ]);

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== contract.toLowerCase()) {
      continue;
    }

    const parsed = iface.parseLog({topics: [...log.topics], data: log.data});

    if (parsed) {
      return String(parsed.args.tokenId);
    }
  }

  return null;
};

export interface IMintResult {
  hash: string;
  contract: string;
  token: Awaited<ReturnType<typeof readToken>> | null;
}

const revealMinted = async (
  hash: string,
  receipt: ITxReceipt,
  contract: string,
): Promise<IMintResult> => {
  const tokenId = await mintedTokenId(receipt, contract);

  if (!tokenId) {
    return {hash, contract, token: null};
  }

  const signer = await currentSigner();

  return {hash, contract, token: await readToken(signer, contract, tokenId)};
};

const gasPriceOf = async (signer: JsonRpcSigner): Promise<bigint> => {
  const fees = await signer.provider.getFeeData();

  return fees.maxFeePerGas ?? fees.gasPrice ?? 0n;
};

export const claimPass = async (handlers: ITxHandlers): Promise<IMintResult> => {
  const signer = await currentSigner();
  const pass = await getPass(signer);

  const {hash, receipt} = await send(
    () => pass.claim.estimateGas(),
    () => pass.claim(),
    handlers,
    await gasPriceOf(signer),
  );

  return revealMinted(hash, receipt, PASS_ADDRESS);
};

export const sendTip = async (
  amountWei: bigint,
  message: string,
  handlers: ITxHandlers,
): Promise<string> => {
  const signer = await currentSigner();
  const jar = await getTipJar(signer);

  const {hash} = await send(
    () => jar.tip.estimateGas(message, {value: amountWei}),
    () => jar.tip(message, {value: amountWei}),
    handlers,
    await gasPriceOf(signer),
  );

  return hash;
};

export const mintArtifact = async (
  tier: ITier,
  handlers: ITxHandlers,
): Promise<IMintResult> => {
  const signer = await currentSigner();
  const artifacts = await getArtifacts(signer);

  // The price is read from the contract, never from the UI: a stale constant in
  // the bundle would send the wrong value and revert.
  const price = await artifacts.priceOf(tier);

  const {hash, receipt} = await send(
    () => artifacts.mint.estimateGas(tier, {value: price}),
    () => artifacts.mint(tier, {value: price}),
    handlers,
    await gasPriceOf(signer),
  );

  return revealMinted(hash, receipt, ARTIFACTS_ADDRESS);
};

export interface ITierInfo {
  remaining: number;
}

/** How many of each tier are left — straight from the chain, not from a banner. */
export const readTiers = async (): Promise<Record<ITier, ITierInfo>> => {
  const signer = await currentSigner();
  const artifacts = await getArtifacts(signer);

  const entries = await Promise.all(
    TIERS.map(async (tier) => [tier.id, {remaining: Number(await artifacts.remaining(tier.id))}]),
  );

  return Object.fromEntries(entries) as Record<ITier, ITierInfo>;
};

/** The wallet's ETH balance, in wei — shown in the header and after every tx. */
export const readBalance = async (address: string): Promise<string> => {
  const signer = await currentSigner();
  const balance = await signer.provider.getBalance(address);

  return balance.toString();
};

export const hasClaimed = async (wallet: string): Promise<boolean> => {
  const signer = await currentSigner();
  const pass = await getPass(signer);

  return pass.claimed(wallet);
};
