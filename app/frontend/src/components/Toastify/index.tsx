import {Flip, ToastContainer} from 'react-toastify';

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

export default Toastify;
