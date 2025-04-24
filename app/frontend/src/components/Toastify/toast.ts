import {toast as notify} from 'react-toastify';

export type IToastMethod = 'info' | 'warning' | 'error' | 'success';

/**
 * Everything is coerced to a string first. Server error bodies are not always
 * strings — handing react-toastify an object made React throw "Objects are not
 * valid as a React child" while the app was already reporting a failure.
 */
export const toast = (message: unknown, method: IToastMethod = 'info', autoClose = 5000) => {
  const text = typeof message === 'string' ? message : JSON.stringify(message);

  notify[method](text, {autoClose});
};
