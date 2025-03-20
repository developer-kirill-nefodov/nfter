import type {Request, Response} from 'express';

import {getPublicStats} from '../../web3/stats.service';

/** Public by design: the landing page must explain itself before anyone connects. */
export const getStatsController = async (req: Request, res: Response) => {
  res.status(200).json(await getPublicStats({refresh: req.query.refresh === 'true'}));
};
