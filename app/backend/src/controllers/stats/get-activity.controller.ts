import type {Request, Response} from 'express';

import {getActivity} from '../../web3/stats.service';

export const getActivityController = async (_req: Request, res: Response) => {
  res.status(200).json({items: await getActivity()});
};
