export interface IReferralStats {
  code: string | null;
  /** The address the chain will pay — null until a wallet is linked. */
  address: string | null;
  pendingEth: string;
  lifetimeEth: string;
  invited: number;
  /** The code of whoever invited this user, if anybody. */
  referredBy: string | null;
  /** …and their wallet, which is what the contract needs. Null if they have none. */
  referredByAddress: string | null;
}

export interface IInviterEntry {
  rank: number;
  address: string;
  invited: number;
  earnedEth: string;
}

export interface ITreasury {
  owner: string;
  artifacts: {contract: string; balanceEth: string};
  tipJar: {contract: string; balanceEth: string};
  marketplace: {contract: string; proceedsEth: string};
  referrals: {contract: string; balanceEth: string};
  totalEth: string;
}
