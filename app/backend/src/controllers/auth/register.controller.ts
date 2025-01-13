import type {Request, Response} from 'express';

import {AppError} from '../../errors/app-error';
import {readBody} from '../../helpers/request';
import {hashPassword} from '../../helpers/user';
import UserModel from '../../models/user.model';
import {issueSession} from '../../services/auth/session.service';

export const registerController = async (req: Request, res: Response) => {
  const {email, password} = readBody<{email: string; password: string}>(req);

  const existing = await UserModel.findOne({where: {email}});

  if (existing) {
    throw AppError.conflict('An account with that email already exists');
  }

  const user = await UserModel.create({
    email,
    password: await hashPassword(password),
    role: {name: 'USER', permissions: {}},
  });

  await issueSession(res, user, 'Your account has been created.');
};
