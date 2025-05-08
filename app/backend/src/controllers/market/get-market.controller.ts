import type {Request, Response} from 'express';

import {getMarket} from '../../web3/market.service';

export const getMarketController = async (req: Request, res: Response) => {
  res.status(200).json(await getMarket({refresh: req.query.refresh === 'true'}));
};
