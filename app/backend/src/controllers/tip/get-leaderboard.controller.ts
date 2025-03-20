import type {Request, Response} from 'express';

import {getLeaderboard} from '../../web3/tip.service';

export const getLeaderboardController = async (_req: Request, res: Response) => {
  res.status(200).json({entries: await getLeaderboard()});
};
