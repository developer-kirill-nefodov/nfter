import {Contract, formatEther, getAddress, type EventLog} from 'ethers';

import {env} from '../config';
import {redis} from '../db';
import {logger} from '../lib/logger';
import {publishLive} from '../live/channel';

import {MARKETPLACE_ABI} from './abis';
import {readEvents, syncContract} from './indexer.service';
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

const marketContract = new Contract(env.web3.marketplace, MARKETPLACE_ABI, provider);

const market = marketContract as unknown as {
  listingOf(collection: string, tokenId: string): Promise<[string, bigint]>;
};

const LOOKBACK_BLOCKS = 500;

type ICandidate = {collection: string; tokenId: string};

/**
 * The indexed `Listed` events are the cheap path, but they are only as fresh as the last write to
 * `chain_events`. A listing that was mined a second ago and lost its database row — a failed write,
 * a cursor that moved on without it — would never be a candidate again. So we also sweep the last
 * few hundred blocks straight from the node. `listingOf` decides what is actually on sale; this
 * only decides what we bother to ask about, and asking about too much is harmless.
 */
const recentlyListed = async (): Promise<ICandidate[]> => {
  try {
    const head = await provider.getBlockNumber();

    const logs = (await marketContract.queryFilter(
      marketContract.filters.Listed!(),
      Math.max(env.web3.fromBlock, head - LOOKBACK_BLOCKS),
      head,
    )) as EventLog[];

    return logs
      .filter((log) => log.args)
      .map((log) => ({
        collection: getAddress(String(log.args.collection)),
        tokenId: String(log.args.tokenId),
      }));
  } catch (err) {
    logger.warn({err}, 'could not sweep recent listings from the node');

    return [];
  }
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
  const [listed, sold, recent] = await Promise.all([
    readEvents(env.web3.marketplace, 'Listed'),
    readEvents(env.web3.marketplace, 'Sold'),
    recentlyListed(),
  ]);

  const candidates = new Map<string, ICandidate>();

  for (const {args} of listed) {
    const collection = getAddress(args.collection ?? '');
    const tokenId = args.tokenId ?? '0';

    candidates.set(`${collection}:${tokenId}`, {collection, tokenId});
  }

  for (const candidate of recent) {
    candidates.set(`${candidate.collection}:${candidate.tokenId}`, candidate);
  }

  const listings = (
    await Promise.all(
      [...candidates.values()].map(async ({collection, tokenId}) => {
        try {
          const [seller, price] = await market.listingOf(collection, tokenId);

          if (price === 0n) {
            return null;
          }

          // A token whose art we cannot read is still for sale. Dropping the whole book because one
          // tokenURI call failed is how a working marketplace renders itself empty.
          const metadata = await metadataOf(collection, tokenId).catch((err: unknown) => {
            logger.warn({err, collection, tokenId}, 'listing metadata unreadable');

            return {name: `#${tokenId}`, image: '', rarity: ''};
          });

          return {
            collection,
            tokenId,
            seller: getAddress(seller),
            price: price.toString(),
            priceEth: formatEther(price),
            ...metadata,
          };
        } catch (err) {
          logger.warn({err, collection, tokenId}, 'could not read a listing');

          return null;
        }
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

const EMPTY_BOOK: IMarket = {
  contract: env.web3.marketplace,
  feeBps: 250,
  listings: [],
  sales: [],
};

// The refresh path is public and expensive (a log sweep plus a listingOf/tokenURI per candidate).
// Left ungated, any anonymous client can loop `?refresh=true` and both exhaust the RPC and evict
// everyone else's cache. Two guards: collapse concurrent refreshes into one execution, and refuse
// to do the heavy read more than once every few seconds — a real user's post-transaction poll still
// gets fresh data, a flood does not get a fresh RPC fan-out per request.
const REFRESH_COOLDOWN_SEC = 3;

let refreshInFlight: Promise<IMarket> | null = null;

const doRefresh = async (cached: string | null): Promise<IMarket> => {
  const written = await syncContract(env.web3.marketplace);

  if (written > 0) {
    await publishLive({type: 'chain', written, head: 0});
  }

  let result: IMarket;

  try {
    result = await readMarket();
  } catch (err) {
    // Caching an empty book on a transient RPC failure hides every real listing for the whole TTL.
    // Serve the last good answer if we have one, and do not overwrite it with this one.
    logger.warn({err}, 'marketplace unreadable');

    return cached ? (JSON.parse(cached) as IMarket) : EMPTY_BOOK;
  }

  await redis.setEx(CACHE_KEY, CACHE_TTL_SEC, JSON.stringify(result));

  return result;
};

export const getMarket = async ({refresh = false} = {}): Promise<IMarket> => {
  const cached = await redis.get(CACHE_KEY);

  if (!refresh && cached) {
    return JSON.parse(cached) as IMarket;
  }

  // On a forced refresh with a warm cache, honour the cooldown so a flood cannot fan out the RPC.
  // A cold cache (no data at all) always reads — there is nothing safe to serve otherwise.
  if (refresh && cached && (await redis.get(`${CACHE_KEY}:refreshed`))) {
    return JSON.parse(cached) as IMarket;
  }

  // One heavy read at a time, shared by every caller that arrives while it runs. This also collapses
  // a cold-cache thundering herd (many clients on the same expired cache) into a single fan-out.
  if (!refreshInFlight) {
    refreshInFlight = doRefresh(cached).finally(() => {
      refreshInFlight = null;
    });

    if (refresh) {
      void redis
        .setEx(`${CACHE_KEY}:refreshed`, REFRESH_COOLDOWN_SEC, '1')
        .catch((err: unknown) => logger.warn({err}, 'could not set market refresh cooldown'));
    }
  }

  return refreshInFlight;
};
