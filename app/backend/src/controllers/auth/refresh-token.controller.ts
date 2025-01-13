import type {Response} from 'express';

import {
  MESSAGE_TOKEN_UPDATED,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_OPTIONS,
} from '../../constants';
import {createTokens, revokeSession} from '../../helpers/token/token';
import type {IRequestAuth} from '../../middlewares/guard/authorized';

export const refreshTokenController = async (req: IRequestAuth, res: Response) => {
  const {sid, ...data} = req.session;

  // Rotation: the old session id dies with the request that used it, so a
  // refresh token can be spent exactly once.
  await revokeSession(data.id, sid);

  const tokens = await createTokens(data);

  res
    .status(200)
    .cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, REFRESH_COOKIE_OPTIONS)
    .json({token: tokens.accessToken, user: data, message: MESSAGE_TOKEN_UPDATED});
};
