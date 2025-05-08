import {toast as notify} from 'react-toastify';

export type IToastMethod = 'info' | 'warning' | 'error' | 'success';

export const toast = (message: unknown, method: IToastMethod = 'info', autoClose = 5000) => {
  const text = typeof message === 'string' ? message : JSON.stringify(message);

  notify[method](text, {autoClose});
};
