import {
  forgotPasswordController,
  loginController,
  logoutController,
  meController,
  nonceController,
  refreshTokenController,
  registerController,
  resetPasswordController,
  walletLinkController,
  walletLoginController,
} from '../../controllers/auth';
import {authed, isAuthorized, isRefreshToken} from '../../middlewares/guard';
import {authLimiter, forgotPasswordLimiter} from '../../middlewares/rate-limit';
import {validate} from '../../middlewares/validate';
import {
  forgotPasswordValidator,
  loginValidator,
  registerValidator,
  resetPasswordValidator,
  siweValidator,
} from '../../middlewares/validators/auth.validators';
import type {IAnyRouter} from '../index';

const AuthRouters: IAnyRouter = {
  prefix: 'auth',
  routeData: [
    {
      method: 'get',
      path: 'me',
      handler: meController,
    },
    {
      method: 'post',
      path: 'register',
      middleware: [authLimiter, validate(registerValidator)],
      handler: registerController,
    },
    {
      method: 'post',
      path: 'login',
      middleware: [authLimiter, validate(loginValidator)],
      handler: loginController,
    },
    {
      method: 'post',
      path: 'logout',
      middleware: [isAuthorized],
      handler: authed(logoutController),
    },
    {
      method: 'post',
      path: 'refresh-token',
      middleware: [isRefreshToken],
      handler: authed(refreshTokenController),
    },
    {
      method: 'post',
      path: 'forgot-password',
      middleware: [forgotPasswordLimiter, validate(forgotPasswordValidator)],
      handler: forgotPasswordController,
    },
    {
      method: 'post',
      path: 'reset-password',
      middleware: [authLimiter, validate(resetPasswordValidator)],
      handler: resetPasswordController,
    },
    // Sign-In with Ethereum: fetch a nonce, sign it in the wallet, hand the
    // signature back. No password ever crosses the wire.
    {
      method: 'get',
      path: 'nonce',
      middleware: [authLimiter],
      handler: nonceController,
    },
    {
      method: 'post',
      path: 'wallet-login',
      middleware: [authLimiter, validate(siweValidator)],
      handler: walletLoginController,
    },
    {
      method: 'post',
      path: 'wallet-link',
      middleware: [isAuthorized, validate(siweValidator)],
      handler: authed(walletLinkController),
    },
  ],
};

export default AuthRouters;
