import type {NextFunction, Request, RequestHandler, Response} from 'express';

import {REFRESH_COOKIE_NAME} from '../../constants';
import {AppError} from '../../errors/app-error';
import {readCookie} from '../../helpers/request';
import {getValidSession, type ISession} from '../../helpers/token/token';

/** A request that has already passed a guard, so the session is known to be there. */
export interface IRequestAuth extends Request {
  session: ISession;
}

/**
 * Bridges a guarded handler to Express's own RequestHandler type. The cast is
 * confined to this one place — every route that uses it is registered behind a
 * guard that sets `req.session`, so the narrowing is sound.
 */
export const authed =
  (handler: (req: IRequestAuth, res: Response) => Promise<void>): RequestHandler =>
  (req, res) =>
    handler(req as IRequestAuth, res);

/**
 * 401 means "your access token is dead but your refresh token is not" — the
 * client is expected to refresh and retry. 403 means the session is gone for
 * good and the user has to sign in again. Keeping those two apart is what lets
 * the SPA retry silently in the first case and stop trying in the second.
 */
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

/** Guards the refresh endpoint itself: only the refresh cookie counts here. */
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
