import type {JsonRpcSigner} from 'ethers';

import {
  ARTIFACTS_ADDRESS,
  MARKETPLACE_ADDRESS,
  NO_REFERRER,
  PASS_ADDRESS,
  getApproval,
  getArtifacts,
  getMarket,
  getPass,
  getReferrals,
  getTipJar,
  readToken,
  TIERS,
  type ITier,
  type ITransactionResponse,
  type ITxReceipt,
} from './contracts';
import {readProvider} from './read-provider';
import {CHAIN_ID, CHAIN_NAME, WalletError, connectWallet, switchChain} from './wallet';

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

  if (/NotApproved/i.test(text)) {
    return 'The market is not allowed to move that token yet — approve it and try again.';
  }

  if (/AlreadyListed/i.test(text)) {
    return 'That token is already on sale.';
  }

  if (/NotListed/i.test(text)) {
    return 'That listing is gone — it has been sold or taken down.';
  }

  if (/OwnSale/i.test(text)) {
    return 'You cannot buy your own listing.';
  }

  if (/NothingToWithdraw/i.test(text)) {
    return 'There is nothing to withdraw yet.';
  }

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
  onApproving?: (hash?: string) => void;
}

let linkedWallet: string | null = null;

export const setLinkedWallet = (address: string | null): void => {
  linkedWallet = address;
};

const short = (address: string): string => `${address.slice(0, 6)}…${address.slice(-4)}`;

const currentSigner = async (): Promise<JsonRpcSigner> => {
  let {address, chainId, signer} = await connectWallet();

  if (linkedWallet && address.toLowerCase() !== linkedWallet.toLowerCase()) {
    throw new WalletError(
      `Your wallet is on ${short(address)}, but this account is linked to ${short(linkedWallet)}. ` +
        'Switch accounts in MetaMask, or connect this wallet to the account you are signed in as.',
    );
  }

  // The signer is bound to whatever network the wallet is on right now. Our contract addresses only
  // exist on CHAIN_ID; on any other network a payable call to one of them is a value transfer to an
  // address with no code — it does not revert, so real ETH would leave and never come back. Never
  // build a transaction until the wallet is provably on the right chain.
  if (chainId !== CHAIN_ID) {
    ({address, chainId, signer} = await switchChain(CHAIN_ID));

    if (chainId !== CHAIN_ID) {
      throw new WalletError(
        `Your wallet is on the wrong network. Switch it to ${CHAIN_NAME} and try again.`,
      );
    }

    if (linkedWallet && address.toLowerCase() !== linkedWallet.toLowerCase()) {
      throw new WalletError(
        `Your wallet is on ${short(address)}, but this account is linked to ${short(linkedWallet)}.`,
      );
    }
  }

  return signer;
};

/**
 * Wait for a mined receipt, surviving the two things ethers turns into an exception even though the
 * user's intent went through: a "Speed up" / "Cancel" in MetaMask (`TRANSACTION_REPLACED`, where the
 * replacement is usually mined fine) and our own confirmations count. Only a genuine revert or a
 * real cancellation should reach the caller as a failure.
 */
const waitMined = async (tx: ITransactionResponse): Promise<{hash: string; receipt: ITxReceipt}> => {
  try {
    const receipt = await tx.wait(1);

    if (!receipt || receipt.status === 0) {
      throw new Error('The transaction was mined but reverted.');
    }

    return {hash: tx.hash, receipt};
  } catch (error) {
    const replaced = error as {
      code?: string;
      reason?: string;
      receipt?: ITxReceipt & {hash?: string};
      replacement?: {hash?: string};
    };

    if (replaced?.code === 'TRANSACTION_REPLACED') {
      // "repriced" is a Speed-up: the exact same transaction was resubmitted with a higher fee and
      // mined. That is our transaction succeeding, not a failure — only this case is safe to accept.
      if (replaced.reason === 'repriced' && replaced.receipt && replaced.receipt.status !== 0) {
        // Report the hash that actually mined (the replacement), not `tx.hash`, which was dropped —
        // otherwise the explorer link and any stored mint hash point at a transaction that no longer
        // exists on chain.
        const minedHash = replaced.replacement?.hash ?? replaced.receipt.hash ?? tx.hash;

        return {hash: minedHash, receipt: replaced.receipt};
      }

      // "cancelled" (0-value self-send) or "replaced" (a different transaction) means our intended
      // transaction never went through.
      throw new WalletError('The transaction was replaced in your wallet before it confirmed.');
    }

    throw error;
  }
};

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

  return waitMined(tx);
};

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
  // The mint is already confirmed — this whole block is decoration. The read provider is a
  // different node than the wallet's and routinely lags a block, so tokenURI can revert on a token
  // that demonstrably exists. Letting that throw would turn a paid, successful mint into a reported
  // failure and skip every post-mint refresh. Reveal is best-effort; the transaction is not.
  try {
    const tokenId = await mintedTokenId(receipt, contract);

    if (!tokenId) {
      return {hash, contract, token: null};
    }

    return {hash, contract, token: await readToken(await readProvider(), contract, tokenId)};
  } catch {
    return {hash, contract, token: null};
  }
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
  referrer: string = NO_REFERRER,
): Promise<IMintResult> => {
  const signer = await currentSigner();
  const artifacts = await getArtifacts(signer);

  const price = await artifacts.priceOf(tier);

  const {hash, receipt} = await send(
    () => artifacts.mint.estimateGas(tier, referrer, {value: price}),
    () => artifacts.mint(tier, referrer, {value: price}),
    handlers,
    await gasPriceOf(signer),
  );

  return revealMinted(hash, receipt, ARTIFACTS_ADDRESS);
};

export interface ITierInfo {
  remaining: number;
}

export const readTiers = async (): Promise<Record<ITier, ITierInfo>> => {
  const artifacts = await getArtifacts(await readProvider());

  const entries = await Promise.all(
    TIERS.map(async (tier) => [tier.id, {remaining: Number(await artifacts.remaining(tier.id))}]),
  );

  return Object.fromEntries(entries) as Record<ITier, ITierInfo>;
};

export const readBalance = async (address: string): Promise<string> => {
  const provider = await readProvider();

  return (await provider.getBalance(address)).toString();
};

export const listToken = async (
  collection: string,
  tokenId: string,
  priceWei: bigint,
  handlers: ITxHandlers,
): Promise<string> => {
  const signer = await currentSigner();
  const approval = await getApproval(signer, collection);

  const approved = await approval.isApprovedForAll(await signer.getAddress(), MARKETPLACE_ADDRESS);

  if (!approved) {
    handlers.onApproving?.();

    const tx = await approval.setApprovalForAll(MARKETPLACE_ADDRESS, true);

    // The first listing from a wallet is two transactions, and this one can sit in the mempool for
    // a minute. Hand the hash up so the panel can show it and link to the explorer instead of
    // spinning silently — a silent minute is indistinguishable from a hang.
    handlers.onApproving?.(tx.hash);

    const receipt = await tx.wait(1);

    if (!receipt || receipt.status === 0) {
      throw new Error('The approval was mined but reverted — the market cannot move that token.');
    }
  }

  const market = await getMarket(signer);

  const {hash} = await send(
    () => market.list.estimateGas(collection, tokenId, priceWei),
    () => market.list(collection, tokenId, priceWei),
    handlers,
    await gasPriceOf(signer),
  );

  return hash;
};

export interface IListingState {
  seller: string;
  price: bigint;
}

/** What the chain says right now — the book on the server can be a tick behind, this cannot. */
export const readListing = async (
  collection: string,
  tokenId: string,
): Promise<IListingState | null> => {
  const market = await getMarket(await readProvider());

  const [seller, price] = await market.listingOf(collection, tokenId);

  return price === 0n ? null : {seller, price};
};

export const buyListing = async (
  collection: string,
  tokenId: string,
  _priceWei: bigint,
  handlers: ITxHandlers,
  referrer: string = NO_REFERRER,
): Promise<string> => {
  const signer = await currentSigner();

  // The price we were handed came from the (possibly cached) book. The contract checks msg.value
  // against the live price exactly, so buying with a stale figure just burns gas on a WrongPrice
  // revert. Read the current listing and pay what it actually asks — or tell the user it is gone.
  const live = await readListing(collection, tokenId);

  if (!live) {
    throw new Error('NotListed');
  }

  const value = live.price;
  const market = await getMarket(signer);

  const {hash} = await send(
    () => market.buy.estimateGas(collection, tokenId, referrer, {value}),
    () => market.buy(collection, tokenId, referrer, {value}),
    handlers,
    await gasPriceOf(signer),
  );

  return hash;
};

export const cancelListing = async (
  collection: string,
  tokenId: string,
  handlers: ITxHandlers,
): Promise<string> => {
  const signer = await currentSigner();
  const market = await getMarket(signer);

  const {hash} = await send(
    () => market.cancel.estimateGas(collection, tokenId),
    () => market.cancel(collection, tokenId),
    handlers,
    await gasPriceOf(signer),
  );

  return hash;
};

export const withdrawProceeds = async (handlers: ITxHandlers): Promise<string> => {
  const signer = await currentSigner();
  const market = await getMarket(signer);

  const {hash} = await send(
    () => market.withdraw.estimateGas(),
    () => market.withdraw(),
    handlers,
    await gasPriceOf(signer),
  );

  return hash;
};

export const withdrawReferralEarnings = async (handlers: ITxHandlers): Promise<string> => {
  const signer = await currentSigner();
  const referrals = await getReferrals(signer);

  const {hash} = await send(
    () => referrals.withdraw.estimateGas(),
    () => referrals.withdraw(),
    handlers,
    await gasPriceOf(signer),
  );

  return hash;
};

export const readProceeds = async (wallet: string): Promise<string> => {
  const market = await getMarket(await readProvider());

  return (await market.proceeds(wallet)).toString();
};

export const hasClaimed = async (wallet: string): Promise<boolean> => {
  const pass = await getPass(await readProvider());

  return pass.claimed(wallet);
};

export const isApprovedForMarket = async (collection: string, owner: string): Promise<boolean> => {
  const approval = await getApproval(await readProvider(), collection);

  return approval.isApprovedForAll(owner, MARKETPLACE_ADDRESS);
};
