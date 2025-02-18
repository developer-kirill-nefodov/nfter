import {Flip, ToastContainer, toast as notify} from 'react-toastify';

export type IToastMethod = 'info' | 'warning' | 'error' | 'success';

const Toastify = () => (
  <ToastContainer
    position="bottom-center"
    transition={Flip}
    autoClose={5000}
    limit={4}
    theme="dark"
    closeOnClick
    pauseOnHover
    pauseOnFocusLoss
    draggable
  />
);

/**
 * Everything is coerced to a string first. Server error bodies are not always
 * strings — handing react-toastify an object made React throw "Objects are not
 * valid as a React child" while the app was already reporting a failure.
 */
export const toast = (message: unknown, method: IToastMethod = 'info', autoClose = 5000) => {
  const text = typeof message === 'string' ? message : JSON.stringify(message);

  notify[method](text, {autoClose});
};

export default Toastify;
