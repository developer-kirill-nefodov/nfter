import {LIFETIME_RESET_TOKEN_SEC} from './token';

export const MESSAGE_RESET_PASSWORD =
  `If that email is registered, a password reset link is on its way. ` +
  `The link expires in ${LIFETIME_RESET_TOKEN_SEC / 60} minutes.`;

export const MESSAGE_PASSWORD_CHANGED = 'Your password has been changed.';
export const MESSAGE_LOGGED_IN = 'You have successfully logged in.';
export const MESSAGE_LOGGED_OUT = 'You have successfully logged out.';
export const MESSAGE_TOKEN_UPDATED = 'Token updated.';
export const MESSAGE_INVALID_CREDENTIALS = 'Email or password is not correct.';
