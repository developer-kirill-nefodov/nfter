import type {NextFunction, Request, RequestHandler, Response} from 'express';

import {REFRESH_COOKIE_NAME} from '../../constants';
import {AppError} from '../../errors/app-error';
import {readCookie} from '../../helpers/request';
import {getValidSession, type ISession} from '../../helpers/token/token';

export interface IRequestAuth extends Request {
  session: ISession;
}

export const authed =
  (handler: (req: IRequestAuth, res: Response) => Promise<void>): RequestHandler =>
  (req, res) =>
    handler(req as IRequestAuth, res);

export const isAuthorized = async (req: Request, _res: Response, next: NextFunction) => {
  const accessToken = req.headers.authorization?.split(' ')[1];
  const session = await getValidSession(accessToken, 'access');

  if (session) {
    req.session = session;
    next();
    return;
  }

  const refresh = await getValidSession(readCookie(req, REFRESH_COOKIE_NAME), 'refresh');

  throw refresh
    ? AppError.unauthorized('Access token expired')
    : AppError.forbidden('You are not authorized');
};

export const isRefreshToken = async (req: Request, _res: Response, next: NextFunction) => {
  const session = await getValidSession(readCookie(req, REFRESH_COOKIE_NAME), 'refresh');

  if (!session) {
    throw AppError.forbidden('Your session has expired');
  }

  req.session = session;
  next();
};

export const hasRole =
  (...roles: string[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.session || !roles.includes(req.session.role.name)) {
      throw AppError.forbidden('You do not have the required permission');
    }

    next();
  };
