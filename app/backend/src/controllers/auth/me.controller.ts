import type {Request, Response} from 'express';

import {REFRESH_COOKIE_NAME} from '../../constants';
import {readCookie} from '../../helpers/request';
import {getValidSession} from '../../helpers/token/token';

const VISITOR = {role: {name: 'VISITOR', permissions: {}}} as const;

/**
 * The SPA calls this on every boot to find out who it is talking to. A visitor
 * is a normal answer here, not an error — only an access token that is dead
 * while the refresh token is still alive gets a 401, which is the client's cue
 * to refresh and retry.
 */
export const meController = async (req: Request, res: Response) => {
  const accessToken = req.headers.authorization?.split(' ')[1];
  const session = await getValidSession(accessToken, 'access');

  if (session) {
    // The session id is an internal detail; the client has no use for it.
    const {sid: _sid, ...user} = session;
    res.status(200).json(user);
    return;
  }

  const refresh = await getValidSession(readCookie(req, REFRESH_COOKIE_NAME), 'refresh');

  if (refresh) {
    res.status(401).json({message: 'Access token expired', ...VISITOR});
    return;
  }

  res.status(200).json(VISITOR);
};
