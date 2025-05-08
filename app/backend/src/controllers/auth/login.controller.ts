import type {Request, Response} from 'express';

import {MESSAGE_INVALID_CREDENTIALS, MESSAGE_LOGGED_IN} from '../../constants';
import {AppError} from '../../errors/app-error';
import {readBody} from '../../helpers/request';
import {hashPassword, needsRehash, verifyPassword} from '../../helpers/user';
import UserModel from '../../models/user.model';
import {issueSession} from '../../services/auth/session.service';

export const loginController = async (req: Request, res: Response) => {
  const {email, password} = readBody<{email: string; password: string}>(req);

  const user = await UserModel.scope('withPassword').findOne({where: {email}});

  if (!user?.password || !(await verifyPassword(user.password, password))) {
    throw AppError.unauthorized(MESSAGE_INVALID_CREDENTIALS);
  }

  if (needsRehash(user.password)) {
    await user.update({password: await hashPassword(password)});
  }

  await issueSession(res, user, MESSAGE_LOGGED_IN);
};
