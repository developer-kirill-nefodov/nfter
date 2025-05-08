import type {Request, Response} from 'express';

import {REFRESH_COOKIE_NAME} from '../../constants';
import {readCookie} from '../../helpers/request';
import {getValidSession} from '../../helpers/token/token';
import {isFounder} from '../../web3/referral.service';

const VISITOR = {role: {name: 'VISITOR', permissions: {}}} as const;

export const meController = async (req: Request, res: Response) => {
  const accessToken = req.headers.authorization?.split(' ')[1];
  const session = await getValidSession(accessToken, 'access');

  if (session) {
    const {sid: _sid, ...user} = session;

    res.status(200).json({...user, isFounder: await isFounder(user.walletAddress)});
    return;
  }

  const refresh = await getValidSession(readCookie(req, REFRESH_COOKIE_NAME), 'refresh');

  if (refresh) {
    res.status(401).json({message: 'Access token expired', ...VISITOR});
    return;
  }

  res.status(200).json(VISITOR);
};
