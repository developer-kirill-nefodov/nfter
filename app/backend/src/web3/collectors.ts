import {getAddress} from 'ethers';

// Rarity points per NFT. Index 0..3 maps to Common/Rare/Epic/Legendary; a free Pass scores PASS_POINTS.
// The scale mirrors the tier price ratios (0.001 / 0.003 / 0.01 / 0.03 ETH).
export const TIER_POINTS = [1, 3, 10, 30];
export const PASS_POINTS = 1;

const TIER_NAMES = ['Common', 'Rare', 'Epic', 'Legendary'];

export interface ICollectorEntry {
  rank: number;
  address: string;
  tokens: number;
  passes: number;
  artifacts: number;
  points: number;
  bestTier: string;
}

export interface ICollectorEvent {
  args: Record<string, string | undefined>;
}

interface IToken {
  owner: string;
  isPass: boolean;
  tier: number;
}

/**
 * Rank collectors by the rarity points of what each address *currently owns*.
 *
 * Ownership is reconstructed from mint attribution (Claimed → Pass, Minted → Artifact with its tier)
 * and then re-pointed by every marketplace `Sold`, applied in chain order so the last buyer wins.
 * That is why a trade moves the numbers: selling a token drops it from the seller's total and adds it
 * to the buyer's. (Only marketplace sales move tokens in this app; direct off-market transfers are
 * not tracked.)
 */
export const rankCollectors = (
  claims: readonly ICollectorEvent[],
  mints: readonly ICollectorEvent[],
  sales: readonly ICollectorEvent[],
  opts: {passContract: string; artifactsContract: string; limit?: number},
): ICollectorEntry[] => {
  const pass = opts.passContract.toLowerCase();
  const arts = opts.artifactsContract.toLowerCase();
  const limit = opts.limit ?? 20;

  const tokens = new Map<string, IToken>();

  for (const {args} of claims) {
    if (args.tokenId === undefined) {
      continue;
    }

    tokens.set(`${pass}:${args.tokenId}`, {
      owner: (args.minter ?? '').toLowerCase(),
      isPass: true,
      tier: -1,
    });
  }

  for (const {args} of mints) {
    if (args.tokenId === undefined) {
      continue;
    }

    tokens.set(`${arts}:${args.tokenId}`, {
      owner: (args.minter ?? '').toLowerCase(),
      isPass: false,
      tier: Number(args.tier ?? 0),
    });
  }

  // sales arrive in chain order (block, then log index), so re-pointing the owner as we go leaves the
  // most recent buyer as the current holder.
  for (const {args} of sales) {
    const token = tokens.get(`${(args.collection ?? '').toLowerCase()}:${args.tokenId}`);

    if (token && args.buyer) {
      token.owner = args.buyer.toLowerCase();
    }
  }

  const totals = new Map<
    string,
    {passes: number; artifacts: number; points: number; bestTier: number}
  >();

  for (const token of tokens.values()) {
    if (!token.owner) {
      continue;
    }

    const current = totals.get(token.owner) ?? {passes: 0, artifacts: 0, points: 0, bestTier: -1};

    if (token.isPass) {
      current.passes += 1;
      current.points += PASS_POINTS;
    } else {
      current.artifacts += 1;
      current.points += TIER_POINTS[token.tier] ?? 0;
      current.bestTier = Math.max(current.bestTier, token.tier);
    }

    totals.set(token.owner, current);
  }

  return [...totals.entries()]
    .map(([address, value]) => ({address, ...value, tokens: value.passes + value.artifacts}))
    .filter((value) => value.tokens > 0)
    .sort((a, b) => (b.points === a.points ? b.tokens - a.tokens : b.points - a.points))
    .slice(0, limit)
    .map((value, index) => ({
      rank: index + 1,
      address: getAddress(value.address),
      tokens: value.tokens,
      passes: value.passes,
      artifacts: value.artifacts,
      points: value.points,
      bestTier: TIER_NAMES[value.bestTier] ?? '',
    }));
};
