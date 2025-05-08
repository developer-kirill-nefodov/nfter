import type {Response} from 'express';

import {REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS} from '../../constants';
import {createTokens, type IUserData} from '../../helpers/token/token';
import type {IUserModel} from '../../interfaces/models/user';
import {isFounder} from '../../web3/referral.service';

export const toUserData = (user: IUserModel): IUserData => ({
  id: user.id,
  email: user.email,
  role: user.role,
  walletAddress: user.wallet_address,
});

export const issueSession = async (res: Response, user: IUserModel, message: string) => {
  const data = toUserData(user);
  const tokens = await createTokens(data);

  const founder = await isFounder(data.walletAddress);

  res
    .status(200)
    .cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, REFRESH_COOKIE_OPTIONS)
    .json({token: tokens.accessToken, user: {...data, isFounder: founder}, message});
};
