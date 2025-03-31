import type {Request, Response} from 'express';

import {getCollectors} from '../../web3/stats.service';

export const getCollectorsController = async (_req: Request, res: Response) => {
  res.status(200).json({entries: await getCollectors()});
};
