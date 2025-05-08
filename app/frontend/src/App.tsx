import {useEffect} from 'react';

import Layout from './components/Layout';
import RevealModal from './components/Nft/RevealModal';
import TxStatus from './components/Tx/TxStatus';
import {useWalletEvents} from './hooks/useWalletEvents';
import AppRoutes from './routes';
import {bootstrapSession} from './store/actions';
import {useStoreDispatch} from './store/hooks';

const App = () => {
  const dispatch = useStoreDispatch();

  useWalletEvents();

  useEffect(() => {
    dispatch(bootstrapSession());
  }, [dispatch]);

  return (
    <Layout>
      <AppRoutes />
      <TxStatus />
      <RevealModal />
    </Layout>
  );
};

export default App;
