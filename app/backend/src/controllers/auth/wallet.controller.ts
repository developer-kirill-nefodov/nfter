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
 * Links a wallet to the account that is already signed in.
 *
 * Sign-In with Ethereum (EIP-4361) is used to prove ownership: the wallet signs
 * a one-time nonce, and the server checks the signature. It proves the address,
 * not the person — which is exactly why it cannot create a session on its own
 * here. An account is an email and a password; a wallet is something an account
 * *has*.
 */
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

  // Re-issue the session: the old access token still says walletAddress: null.
  await issueSession(res, user, 'Wallet linked to your account.');
};

/** Unlinks the wallet, freeing it to be linked to a different account. */
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
