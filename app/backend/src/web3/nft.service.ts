import {Contract, getAddress} from 'ethers';

import {env} from '../config';
import {LIFETIME_NFT_CACHE_SEC} from '../constants';
import {redis} from '../db';
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
}

const contract = new Contract(env.web3.nftContract, ERC721_ABI, provider) as unknown as IErc721;

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

const fetchMetadata = async (tokenId: string, tokenUri: string): Promise<INft> => {
  const url = resolveUri(tokenUri);

  try {
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

const readCollection = async (owner: string): Promise<INftCollection> => {
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
    contract: env.web3.nftContract,
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
  address: string,
  {refresh = false}: {refresh?: boolean} = {},
): Promise<INftCollection> => {
  const owner = getAddress(address);
  const cacheKey = `nft:${env.web3.chainId}:${env.web3.nftContract}:${owner.toLowerCase()}`;

  if (!refresh) {
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached) as INftCollection;
    }
  }

  const collection = await readCollection(owner);

  await redis.setEx(cacheKey, LIFETIME_NFT_CACHE_SEC, JSON.stringify(collection));

  return collection;
};

export const getBalance = async (address: string): Promise<string> => {
  const wei = await provider.getBalance(getAddress(address));
  return wei.toString();
};
