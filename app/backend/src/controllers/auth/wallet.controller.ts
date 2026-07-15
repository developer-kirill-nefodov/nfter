import type {Request, Response} from 'express';

import {AppError} from '../../errors/app-error';
import {readBody} from '../../helpers/request';
import type {IRequestAuth} from '../../middlewares/guard/authorized';
import UserModel from '../../models/user.model';
import {issueSession} from '../../services/auth/session.service';
import {issueNonce, verifySiweMessage} from '../../web3/siwe.service';

export const nonceController = async (_req: Request, res: Response) => {
  res.status(200).json({nonce: await issueNonce()});
};

export const walletLinkController = async (req: IRequestAuth, res: Response) => {
  const {message, signature} = readBody<{message: string; signature: string}>(req);

  const address = await verifySiweMessage(message, signature);

  const owner = await UserModel.findOne({where: {wallet_address: address}});

  if (owner && owner.id !== req.session.id) {
    throw AppError.conflict('That wallet is already linked to another account');
  }

  const user = await UserModel.findByPk(req.session.id);

  if (!user) {
    throw AppError.unauthorized('Account no longer exists');
  }

  try {
    await user.update({wallet_address: address});
  } catch (error) {
    // Two accounts can race past the existence check above and reach the unique constraint on
    // wallet_address. Surface the intended 409 rather than a generic 500.
    if ((error as {name?: string}).name === 'SequelizeUniqueConstraintError') {
      throw AppError.conflict('That wallet is already linked to another account');
    }

    throw error;
  }

  await issueSession(res, user, 'Wallet linked to your account.');
};

export const walletUnlinkController = async (req: IRequestAuth, res: Response) => {
  const user = await UserModel.findByPk(req.session.id);

  if (!user) {
    throw AppError.unauthorized('Account no longer exists');
  }

  if (!user.wallet_address) {
    throw AppError.badRequest('No wallet is linked to this account');
  }

  await user.update({wallet_address: null});

  await issueSession(res, user, 'Wallet disconnected.');
};
