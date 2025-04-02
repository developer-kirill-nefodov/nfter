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

/**
 * ethers types a Contract's methods through an index signature, which under
 * `noUncheckedIndexedAccess` makes every call possibly-undefined. Naming the
 * fragments we use restores real types at the call sites.
 */
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

/**
 * Artifacts first: they are what people buy, collect and come back for. The pass
 * is a membership card — it belongs under the collection, not above it.
 */
export const COLLECTIONS = [env.web3.artifacts, env.web3.nftContract];

const METADATA_FETCH_TIMEOUT_MS = 5_000;

/** ipfs://Qm… is not a URL a browser can fetch; rewrite it onto an HTTP gateway. */
export const resolveUri = (uri: string): string =>
  uri.startsWith('ipfs://') ? `${env.web3.ipfsGateway}${uri.slice('ipfs://'.length)}` : uri;

const emptyMetadata = (tokenId: string): Omit<INft, 'tokenId' | 'tokenUri'> => ({
  name: `#${tokenId}`,
  description: '',
  image: '',
  attributes: [],
});

/**
 * Our own pass returns its metadata as a base64 `data:` URI — the JSON *is* the
 * chain's answer, there is nothing to go and fetch. Decoding it locally skips a
 * network round trip that would only ever fail.
 */
const decodeDataUri = (uri: string): unknown => {
  const comma = uri.indexOf(',');
  const meta = uri.slice(5, comma); // strip "data:"
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
    // A dead IPFS pin must not take the whole gallery down — render the token
    // with a placeholder and move on.
    logger.warn({err, tokenId, url}, 'nft metadata unavailable');
    return {tokenId, tokenUri, ...emptyMetadata(tokenId)};
  }
};

/** ERC-165 id of the ERC721Enumerable extension. */
const ERC721_ENUMERABLE_INTERFACE = '0x780e9d63';

const enumerable = new Map<string, Promise<boolean>>();

/**
 * Walking a wallet's tokens needs tokenOfOwnerByIndex, which is an optional
 * extension. Asking up front turns "execution reverted" — which tells the user
 * nothing — into a sentence they can act on. The answer is a property of the
 * contract, so it is asked once per process, not once per request.
 */
const assertEnumerable = async (address: string): Promise<void> => {
  if (!enumerable.has(address)) {
    enumerable.set(
      address,
      contractAt(address)
        .supportsInterface(ERC721_ENUMERABLE_INTERFACE)
        .catch(() => false),
    );
  }

  if (!(await enumerable.get(address))) {
    logger.error({contract: address}, 'contract does not implement ERC721Enumerable');

    throw AppError.badRequest(
      'That collection does not implement ERC721Enumerable, ' +
        'so its tokens cannot be listed by owner.',
    );
  }
};

const readCollection = async (address: string, owner: string): Promise<INftCollection> => {
  await assertEnumerable(address);

  const contract = contractAt(address);

  const [name, symbol, rawBalance] = await Promise.all([
    contract.name(),
    contract.symbol(),
    contract.balanceOf(owner),
  ]);

  const balance = Number(rawBalance);

  const tokenIds = await Promise.all(
    Array.from({length: balance}, (_, index) =>
      contract.tokenOfOwnerByIndex(owner, index).then(String),
    ),
  );

  const items = await Promise.all(
    tokenIds.map(async (tokenId) => {
      const tokenUri = await contract.tokenURI(tokenId);
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

/**
 * Public RPC endpoints rate-limit hard, and a gallery re-renders often, so the
 * whole collection is cached per owner. `?refresh=true` is the escape hatch a
 * user needs right after minting.
 */
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

  const collections = await Promise.all(
    COLLECTIONS.map((address) => readCollection(address, owner)),
  );

  await redis.setEx(cacheKey, LIFETIME_NFT_CACHE_SEC, JSON.stringify(collections));

  return collections;
};

export const getBalance = async (address: string): Promise<string> => {
  const wei = await provider.getBalance(getAddress(address));
  return wei.toString();
};
