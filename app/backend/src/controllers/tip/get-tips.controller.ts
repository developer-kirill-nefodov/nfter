import type {Request, Response} from 'express';

import {getTipFeed} from '../../web3/tip.service';

export const getTipsController = async (req: Request, res: Response) => {
  const feed = await getTipFeed({refresh: req.query.refresh === 'true'});

  res.status(200).json(feed);
};
