import type {Response} from 'express';

import {AppError} from '../../errors/app-error';
import type {IRequestAuth} from '../../middlewares/guard';
import {getBalance, getNftsByOwner} from '../../web3/nft.service';

export const getNftsController = async (req: IRequestAuth, res: Response) => {
  const owner = req.session.walletAddress;

  if (!owner) {
    throw AppError.badRequest('Connect a wallet to see your collection');
  }

  const refresh = req.query.refresh === 'true';

  const [collection, balance] = await Promise.all([
    getNftsByOwner(owner, {refresh}),
    getBalance(owner),
  ]);

  res.status(200).json({...collection, owner, nativeBalance: balance});
};
