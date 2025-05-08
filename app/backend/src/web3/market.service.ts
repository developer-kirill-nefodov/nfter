import {Contract, formatEther, getAddress} from 'ethers';

import {env} from '../config';
import {redis} from '../db';
import {logger} from '../lib/logger';

import {MARKETPLACE_ABI} from './abis';
import {readEvents} from './indexer.service';
import {provider} from './provider';

export interface IListing {
  collection: string;
  tokenId: string;
  seller: string;
  price: string;
  priceEth: string;
  name: string;
  image: string;
  rarity: string;
}

export interface ISale {
  collection: string;
  tokenId: string;
  seller: string;
  buyer: string;
  priceEth: string;
  feeEth: string;
  txHash: string;
  blockNumber: number;
}

export interface IMarket {
  contract: string;
  feeBps: number;
  listings: IListing[];
  sales: ISale[];
}

const market = new Contract(env.web3.marketplace, MARKETPLACE_ABI, provider) as unknown as {
  listingOf(collection: string, tokenId: string): Promise<[string, bigint]>;
};

const metadataOf = async (collection: string, tokenId: string) => {
  const nft = new Contract(
    collection,
    ['function tokenURI(uint256) view returns (string)'],
    provider,
  ) as unknown as {tokenURI(tokenId: string): Promise<string>};

  const uri = await nft.tokenURI(tokenId);
  const payload = uri.slice(uri.indexOf(',') + 1);

  const json = JSON.parse(Buffer.from(payload, 'base64').toString('utf8')) as {
    name: string;
    image: string;
    attributes: {trait_type: string; value: string | number}[];
  };

  const tier = json.attributes.find(
    ({trait_type}) => trait_type === 'Tier' || trait_type === 'Rarity',
  );

  return {name: json.name, image: json.image, rarity: String(tier?.value ?? '')};
};

const CACHE_KEY = `market:${env.web3.chainId}:${env.web3.marketplace.toLowerCase()}`;
const CACHE_TTL_SEC = 30;

const readMarket = async (): Promise<IMarket> => {
  const [listed, sold] = await Promise.all([
    readEvents(env.web3.marketplace, 'Listed'),
    readEvents(env.web3.marketplace, 'Sold'),
  ]);

  const candidates = new Map<string, {collection: string; tokenId: string}>();

  for (const {args} of listed) {
    const collection = getAddress(args.collection ?? '');
    const tokenId = args.tokenId ?? '0';

    candidates.set(`${collection}:${tokenId}`, {collection, tokenId});
  }

  const listings = (
    await Promise.all(
      [...candidates.values()].map(async ({collection, tokenId}) => {
        const [seller, price] = await market.listingOf(collection, tokenId);

        if (price === 0n) {
          return null;
        }

        const metadata = await metadataOf(collection, tokenId);

        return {
          collection,
          tokenId,
          seller: getAddress(seller),
          price: price.toString(),
          priceEth: formatEther(price),
          ...metadata,
        };
      }),
    )
  ).filter((listing): listing is IListing => listing !== null);

  const sales = sold
    .slice(-20)
    .reverse()
    .map(({args, txHash, blockNumber}) => ({
      collection: getAddress(args.collection ?? ''),
      tokenId: args.tokenId ?? '0',
      seller: getAddress(args.seller ?? ''),
      buyer: getAddress(args.buyer ?? ''),
      priceEth: formatEther(args.price ?? '0'),
      feeEth: formatEther(args.fee ?? '0'),
      txHash,
      blockNumber,
    }));

  return {contract: env.web3.marketplace, feeBps: 250, listings, sales};
};

export const getMarket = async ({refresh = false} = {}): Promise<IMarket> => {
  if (!refresh) {
    const cached = await redis.get(CACHE_KEY);

    if (cached) {
      return JSON.parse(cached) as IMarket;
    }
  }

  let result: IMarket;

  try {
    result = await readMarket();
  } catch (err) {
    logger.warn({err}, 'marketplace unreadable — serving an empty book');
    result = {contract: env.web3.marketplace, feeBps: 250, listings: [], sales: []};
  }

  await redis.setEx(CACHE_KEY, CACHE_TTL_SEC, JSON.stringify(result));

  return result;
};
