export interface IReferralStats {
  code: string | null;
  address: string | null;
  pendingEth: string;
  lifetimeEth: string;
  invited: number;
  referredBy: string | null;
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
