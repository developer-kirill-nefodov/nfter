import type {Request, Response} from 'express';

import {getChainStatus} from '../../web3/chain.service';

export const getChainController = async (req: Request, res: Response) => {
  res.status(200).json(await getChainStatus({refresh: req.query.refresh === 'true'}));
};
