import type {Response} from 'express';

import {REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS} from '../../constants';
import {createTokens, type IUserData} from '../../helpers/token/token';
import type {IUserModel} from '../../interfaces/models/user';

export const toUserData = (user: IUserModel): IUserData => ({
  id: user.id,
  email: user.email,
  role: user.role,
  walletAddress: user.wallet_address,
});

/**
 * The refresh token goes into an httpOnly cookie so JavaScript can never read
 * it; the short-lived access token goes in the body, where the SPA keeps it in
 * memory only. A stolen access token expires in minutes — a stolen refresh
 * token would not.
 */
export const issueSession = async (res: Response, user: IUserModel, message: string) => {
  const data = toUserData(user);
  const tokens = await createTokens(data);

  res
    .status(200)
    .cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, REFRESH_COOKIE_OPTIONS)
    .json({token: tokens.accessToken, user: data, message});
};
