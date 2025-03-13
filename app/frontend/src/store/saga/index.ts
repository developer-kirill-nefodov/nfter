import {all, call} from 'redux-saga/effects';

import {authSaga} from './auth.saga';
import {nftSaga} from './nft.saga';
import {txSaga} from './tx.saga';
import {walletSaga} from './wallet.saga';

export default function* rootSaga() {
  yield all([call(authSaga), call(walletSaga), call(nftSaga), call(txSaga)]);
}
