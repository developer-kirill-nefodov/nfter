import type {Response} from 'express';

import {MESSAGE_LOGGED_OUT, REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS} from '../../constants';
import {revokeSession} from '../../helpers/token/token';
import type {IRequestAuth} from '../../middlewares/guard/authorized';

export const logoutController = async (req: IRequestAuth, res: Response) => {
  const {id, sid} = req.session;

  await revokeSession(id, sid);

  res
    .clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS)
    .status(200)
    .json({message: MESSAGE_LOGGED_OUT});
};
