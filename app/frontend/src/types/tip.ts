export interface ITip {
  from: string;
  amount: string;
  amountEth: string;
  message: string;
  timestamp: number;
  txHash: string;
  blockNumber: number;
}

export interface ITipFeed {
  contract: string;
  owner: string;
  chainId: number;
  totalTips: string;
  totalTipsEth: string;
  tipCount: number;
  tips: ITip[];
  /** False until the jar exists at the configured address on this chain. */
  deployed: boolean;
}
