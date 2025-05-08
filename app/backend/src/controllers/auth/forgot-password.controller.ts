import type {Request, Response} from 'express';
import {readBody} from '../../helpers/request';

import {MESSAGE_RESET_PASSWORD, RESET_COOLDOWN_SEC} from '../../constants';
import UserModel from '../../models/user.model';
import {createResetToken} from '../../services/auth/forgot-password.service';

export const forgotPasswordController = async (req: Request, res: Response) => {
  const {email} = readBody<{email: string}>(req);

  const user = await UserModel.findOne({where: {email}});

  if (user?.email) {
    await createResetToken(user.id, user.email);
  }

  res.status(200).json({message: MESSAGE_RESET_PASSWORD, retryAfter: RESET_COOLDOWN_SEC});
};
