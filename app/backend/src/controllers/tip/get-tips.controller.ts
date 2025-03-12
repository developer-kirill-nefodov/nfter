import type {Request, Response} from 'express';

import {getTipFeed} from '../../web3/tip.service';

/** Public on purpose: the tip feed is public information, and so is the jar. */
export const getTipsController = async (req: Request, res: Response) => {
  const feed = await getTipFeed({refresh: req.query.refresh === 'true'});

  res.status(200).json(feed);
};
