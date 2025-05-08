import type {Request, Response} from 'express';

import {MESSAGE_PASSWORD_CHANGED} from '../../constants';
import {AppError} from '../../errors/app-error';
import {readBody} from '../../helpers/request';
import {revokeAllSessions} from '../../helpers/token/token';
import {hashPassword} from '../../helpers/user';
import UserModel from '../../models/user.model';
import {consumeResetToken} from '../../services/auth/forgot-password.service';

export const resetPasswordController = async (req: Request, res: Response) => {
  const {token, password} = readBody<{token: string; password: string}>(req);

  const userId = await consumeResetToken(token);

  if (!userId) {
    throw AppError.badRequest('This reset link is invalid or has expired');
  }

  const user = await UserModel.findByPk(userId);

  if (!user) {
    throw AppError.badRequest('This reset link is invalid or has expired');
  }

  await user.update({password: await hashPassword(password)});

  await revokeAllSessions(user.id);

  res.status(200).json({message: MESSAGE_PASSWORD_CHANGED});
};
