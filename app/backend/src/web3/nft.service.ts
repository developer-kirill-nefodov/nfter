import {Contract, getAddress} from 'ethers';

import {env} from '../config';
import {LIFETIME_NFT_CACHE_SEC} from '../constants';
import {redis} from '../db';
import {AppError} from '../errors/app-error';
import {logger} from '../lib/logger';

import {ERC721_ABI} from './erc721.abi';
import {provider} from './provider';

export interface INftAttribute {
  trait_type: string;
  value: string | number;
}

export interface INft {
  tokenId: string;
  tokenUri: string;
  name: string;
  description: string;
  image: string;
  attributes: INftAttribute[];
}

export interface INftCollection {
  contract: string;
  chainId: number;
  name: string;
  symbol: string;
  balance: number;
  items: INft[];
}

interface IErc721 {
  name(): Promise<string>;
  symbol(): Promise<string>;
  balanceOf(owner: string): Promise<bigint>;
  tokenURI(tokenId: string): Promise<string>;
  tokenOfOwnerByIndex(owner: string, index: number): Promise<bigint>;
  supportsInterface(interfaceId: string): Promise<boolean>;
}

const contractAt = (address: string) =>
  new Contract(address, ERC721_ABI, provider) as unknown as IErc721;

export const COLLECTIONS = [env.web3.artifacts, env.web3.nftContract];

const METADATA_FETCH_TIMEOUT_MS = 5_000;

export const resolveUri = (uri: string): string =>
  uri.startsWith('ipfs://') ? `${env.web3.ipfsGateway}${uri.slice('ipfs://'.length)}` : uri;

const emptyMetadata = (tokenId: string): Omit<INft, 'tokenId' | 'tokenUri'> => ({
  name: `#${tokenId}`,
  description: '',
  image: '',
  attributes: [],
});

const decodeDataUri = (uri: string): unknown => {
  const comma = uri.indexOf(',');
  const meta = uri.slice(5, comma);
  const payload = uri.slice(comma + 1);

  const raw = meta.endsWith(';base64')
    ? Buffer.from(payload, 'base64').toString('utf8')
    : decodeURIComponent(payload);

  return JSON.parse(raw);
};

const fetchMetadata = async (tokenId: string, tokenUri: string): Promise<INft> => {
  const url = resolveUri(tokenUri);

  try {
    if (tokenUri.startsWith('data:')) {
      const metadata = decodeDataUri(tokenUri) as Partial<INft>;

      return {
        tokenId,
        tokenUri,
        name: metadata.name ?? `#${tokenId}`,
        description: metadata.description ?? '',
        image: metadata.image ?? '',
        attributes: Array.isArray(metadata.attributes) ? metadata.attributes : [],
      };
    }

    const response = await fetch(url, {signal: AbortSignal.timeout(METADATA_FETCH_TIMEOUT_MS)});

    if (!response.ok) {
      throw new Error(`metadata responded ${response.status}`);
    }

    const metadata = (await response.json()) as Partial<INft>;

    return {
      tokenId,
      tokenUri,
      name: metadata.name ?? `#${tokenId}`,
      description: metadata.description ?? '',
      image: metadata.image ? resolveUri(metadata.image) : '',
      attributes: Array.isArray(metadata.attributes) ? metadata.attributes : [],
    };
  } catch (err) {
    logger.warn({err, tokenId, url}, 'nft metadata unavailable');
    return {tokenId, tokenUri, ...emptyMetadata(tokenId)};
  }
};

const ERC721_ENUMERABLE_INTERFACE = '0x780e9d63';
const RPC_ATTEMPTS = 3;
const RPC_BACKOFF_MS = 250;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const withRetry = async <T>(label: string, call: () => Promise<T>): Promise<T> => {
  let last: unknown;

  for (let attempt = 1; attempt <= RPC_ATTEMPTS; attempt += 1) {
    try {
      return await call();
    } catch (err) {
      last = err;
      logger.warn({err, label, attempt}, 'rpc call failed; retrying');
      await wait(RPC_BACKOFF_MS * attempt);
    }
  }

  throw last;
};

const enumerable = new Set<string>();

const assertEnumerable = async (address: string): Promise<void> => {
  if (enumerable.has(address)) {
    return;
  }

  const supported = await withRetry(`supportsInterface:${address}`, () =>
    contractAt(address).supportsInterface(ERC721_ENUMERABLE_INTERFACE),
  );

  if (!supported) {
    logger.error({contract: address}, 'contract does not implement ERC721Enumerable');

    throw AppError.badRequest(
      'That collection does not implement ERC721Enumerable, ' +
        'so its tokens cannot be listed by owner.',
    );
  }

  enumerable.add(address);
};

const readCollection = async (address: string, owner: string): Promise<INftCollection> => {
  await assertEnumerable(address);

  const contract = contractAt(address);

  const [name, symbol, rawBalance] = await Promise.all([
    withRetry(`name:${address}`, () => contract.name()),
    withRetry(`symbol:${address}`, () => contract.symbol()),
    withRetry(`balanceOf:${address}`, () => contract.balanceOf(owner)),
  ]);

  const balance = Number(rawBalance);

  const tokenIds = await Promise.all(
    Array.from({length: balance}, (_, index) =>
      withRetry(`tokenOfOwnerByIndex:${address}:${String(index)}`, () =>
        contract.tokenOfOwnerByIndex(owner, index),
      ).then(String),
    ),
  );

  const items = await Promise.all(
    tokenIds.map(async (tokenId) => {
      const tokenUri = await withRetry(`tokenURI:${address}:${tokenId}`, () =>
        contract.tokenURI(tokenId),
      );

      return fetchMetadata(tokenId, tokenUri);
    }),
  );

  return {
    contract: address,
    chainId: env.web3.chainId,
    name,
    symbol,
    balance,
    items,
  };
};

export const getNftsByOwner = async (
  wallet: string,
  {refresh = false}: {refresh?: boolean} = {},
): Promise<INftCollection[]> => {
  const owner = getAddress(wallet);
  const cacheKey = `nft:${env.web3.chainId}:${owner.toLowerCase()}`;

  if (!refresh) {
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached) as INftCollection[];
    }
  }

  const results = await Promise.allSettled(
    COLLECTIONS.map((address) => readCollection(address, owner)),
  );

  const collections = results
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value);

  const failed = results.filter((result) => result.status === 'rejected');

  for (const result of failed) {
    logger.error({err: result.reason as unknown, owner}, 'collection unreadable');
  }

  if (collections.length === 0) {
    throw AppError.badGateway('The chain is not answering right now. Try again in a moment.');
  }

  if (failed.length === 0) {
    await redis.setEx(cacheKey, LIFETIME_NFT_CACHE_SEC, JSON.stringify(collections));
  }

  return collections;
};

export const getBalance = async (address: string): Promise<string> => {
  const wei = await provider.getBalance(getAddress(address));
  return wei.toString();
};
