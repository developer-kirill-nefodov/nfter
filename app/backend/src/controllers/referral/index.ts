import type {Request, Response} from 'express';

import {AppError} from '../../errors/app-error';
import type {IRequestAuth} from '../../middlewares/guard';
import {getInviters, getReferralStats, isFounder} from '../../web3/referral.service';
import {getTreasury} from '../../web3/treasury.service';

export const getMyReferralsController = async (req: IRequestAuth, res: Response) => {
  res.status(200).json(await getReferralStats(req.session.id));
};

export const getInvitersController = async (_req: Request, res: Response) => {
  res.status(200).json({entries: await getInviters()});
};

export const getTreasuryController = async (req: IRequestAuth, res: Response) => {
  if (!(await isFounder(req.session.walletAddress))) {
    throw AppError.forbidden('The treasury is for the founder — the wallet that owns the contracts');
  }

  res.status(200).json(await getTreasury());
};
