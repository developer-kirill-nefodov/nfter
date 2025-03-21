import {combineReducers, configureStore} from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';

import authReducer from './reducers/auth-slice';
import nftReducer from './reducers/nft-slice';
import statsReducer from './reducers/stats-slice';
import tipReducer from './reducers/tip-slice';
import txReducer from './reducers/tx-slice';
import userReducer from './reducers/user-slice';
import walletReducer from './reducers/wallet-slice';
import rootSaga from './saga';

export const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  wallet: walletReducer,
  nft: nftReducer,
  tip: tipReducer,
  stats: statsReducer,
  tx: txReducer,
});

export const createStore = (preloadedState?: Partial<ReturnType<typeof rootReducer>>) => {
  const sagaMiddleware = createSagaMiddleware();

  const store = configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({thunk: false}).concat(sagaMiddleware),
  });

  sagaMiddleware.run(rootSaga);

  return store;
};

export const store = createStore();

export type AppStore = ReturnType<typeof createStore>;
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = AppStore['dispatch'];
