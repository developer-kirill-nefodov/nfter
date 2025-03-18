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
  walletUnlinkController,
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
    // Sign-In with Ethereum, used to prove ownership of an address — never to
    // create a session. Both routes demand an authenticated caller: a wallet is
    // something an account has, not a way to become one.
    {
      method: 'get',
      path: 'nonce',
      middleware: [authLimiter, isAuthorized],
      handler: nonceController,
    },
    {
      method: 'post',
      path: 'wallet-link',
      middleware: [isAuthorized, validate(siweValidator)],
      handler: authed(walletLinkController),
    },
    {
      method: 'post',
      path: 'wallet-unlink',
      middleware: [isAuthorized],
      handler: authed(walletUnlinkController),
    },
  ],
};

export default AuthRouters;
