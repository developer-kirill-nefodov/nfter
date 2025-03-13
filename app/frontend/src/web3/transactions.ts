import type {JsonRpcSigner} from 'ethers';

import {getPass, getTipJar, type ITransactionResponse} from './contracts';
import {CHAIN_NAME, WalletError, connectWallet} from './wallet';

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
): Promise<string> => {
  const gas = await estimate();

  onGasEstimated((gas * gasPrice).toString());

  const tx = await execute();

  onBroadcast(tx.hash);

  const receipt = await tx.wait(1);

  if (!receipt || receipt.status === 0) {
    throw new Error('The transaction was mined but reverted.');
  }

  return tx.hash;
};

const gasPriceOf = async (signer: JsonRpcSigner): Promise<bigint> => {
  const fees = await signer.provider.getFeeData();

  return fees.maxFeePerGas ?? fees.gasPrice ?? 0n;
};

export const claimPass = async (handlers: ITxHandlers): Promise<string> => {
  const signer = await currentSigner();
  const pass = await getPass(signer);

  return send(
    () => pass.claim.estimateGas(),
    () => pass.claim(),
    handlers,
    await gasPriceOf(signer),
  );
};

export const sendTip = async (
  amountWei: bigint,
  message: string,
  handlers: ITxHandlers,
): Promise<string> => {
  const signer = await currentSigner();
  const jar = await getTipJar(signer);

  return send(
    () => jar.tip.estimateGas(message, {value: amountWei}),
    () => jar.tip(message, {value: amountWei}),
    handlers,
    await gasPriceOf(signer),
  );
};

export const hasClaimed = async (wallet: string): Promise<boolean> => {
  const signer = await currentSigner();
  const pass = await getPass(signer);

  return pass.claimed(wallet);
};
