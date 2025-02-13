import {useEffect} from 'react';

import Layout from './components/Layout';
import {useWalletEvents} from './hooks/useWalletEvents';
import AppRoutes from './routes';
import {bootstrapSession} from './store/actions';
import {useStoreDispatch} from './store/hooks';

const App = () => {
  const dispatch = useStoreDispatch();

  useWalletEvents();

  useEffect(() => {
    // Asks the API who we are. With no access token in memory, the refresh
    // cookie is spent and the session survives a page reload.
    dispatch(bootstrapSession());
  }, [dispatch]);

  return (
    <Layout>
      <AppRoutes />
    </Layout>
  );
};

export default App;
