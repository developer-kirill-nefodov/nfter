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

/**
 * Sign-In with Ethereum (EIP-4361). The wallet proves ownership of an address by
 * signing a one-time message; from there the user gets exactly the same JWT
 * session as a password login, so every downstream route stays auth-agnostic.
 */
export const walletLoginController = async (req: Request, res: Response) => {
  const {message, signature} = readBody<{message: string; signature: string}>(req);

  const address = await verifySiweMessage(message, signature);

  const [user] = await UserModel.findOrCreate({
    where: {wallet_address: address},
    defaults: {
      wallet_address: address,
      role: {name: 'USER', permissions: {}},
    },
  });

  await issueSession(res, user, 'Wallet connected.');
};

/** Attaches a wallet to an account that already signed in with a password. */
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

  await user.update({wallet_address: address});

  await issueSession(res, user, 'Wallet linked to your account.');
};
