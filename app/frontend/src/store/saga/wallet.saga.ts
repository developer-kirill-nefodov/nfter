import type {JsonRpcSigner} from 'ethers';
import {call, put, select, takeLatest} from 'redux-saga/effects';

import {authApi} from '../../api/auth';
import {errorMessage} from '../../api/client';
import {toast} from '../../components/Toastify/toast';
import type {IUser} from '../../types/user';
import {buildSiweMessage} from '../../web3/siwe';
import {
  CHAIN_ID,
  CHAIN_NAME,
  connectWallet,
  revokeWalletAccess,
  signMessage,
  switchChain,
  WalletBusyError,
  WalletError,
  type IWalletConnection,
} from '../../web3/wallet';
import type {RootState} from '../';
import {
  fetchNftsRequest,
  walletAccountChanged,
  walletChainChanged,
  walletLinkRequest,
  walletUnlinkRequest,
} from '../actions';
import {clearNfts} from '../reducers/nft-slice';
import {setUser} from '../reducers/user-slice';
import {
  disconnectWallet,
  setChainId,
  setWallet,
  setWalletError,
  setWalletStatus,
} from '../reducers/wallet-slice';

interface ISignedSiwe {
  message: string;
  signature: string;
}

function* signIn(): Generator<unknown, ISignedSiwe, never> {
  yield put(setWalletStatus('connecting'));

  let connection = (yield call(connectWallet)) as IWalletConnection;

  if (connection.chainId !== CHAIN_ID) {
    toast(`Switching your wallet to ${CHAIN_NAME}…`, 'info');
    connection = (yield call(switchChain, CHAIN_ID)) as IWalletConnection;
  }

  yield put(setWallet({address: connection.address, chainId: CHAIN_ID}));
  yield put(setWalletStatus('signing'));

  const nonce = (yield call(authApi.nonce)) as string;
  const message = (yield call(buildSiweMessage, connection.address, nonce)) as string;
  const signature = (yield call(
    signMessage,
    connection.signer as JsonRpcSigner,
    message,
  )) as string;

  return {message, signature};
}

const failed = function* (error: unknown) {
  if (error instanceof WalletError) {
    yield put(setWalletError(error.message));
    toast(error.message, 'info');
    return;
  }

  if (error instanceof WalletBusyError) {
    yield put(setWalletError(error.message));
    toast(error.message, 'warning');
    return;
  }

  const message = errorMessage(error, 'Wallet sign-in failed');

  yield put(setWalletError(message));
  toast(message, 'error');
};

function* walletLinkSaga() {
  try {
    const signed: ISignedSiwe = yield call(signIn);
    const user: IUser = yield call(authApi.walletLink, signed);

    yield put(setUser(user));
    yield put(setWalletStatus('connected'));
    yield put(fetchNftsRequest());

    toast('Wallet connected.', 'success');
  } catch (error) {
    yield* failed(error);
  }
}

function* walletUnlinkSaga() {
  try {
    const user: IUser = yield call(authApi.walletUnlink);

    yield put(setUser(user));
    yield put(disconnectWallet());
    yield put(clearNfts());

    yield call(revokeWalletAccess);

    toast('Wallet disconnected.', 'success');
  } catch (error) {
    toast(errorMessage(error, 'Could not disconnect the wallet'), 'error');
  }
}

function* accountChangedSaga({payload}: ReturnType<typeof walletAccountChanged>) {
  const {status} = yield select((state: RootState) => state.wallet);
  const signedInAddress: string | null = yield select(
    (state: RootState) => state.user.user.walletAddress,
  );

  if (status === 'connecting' || status === 'signing') {
    return;
  }

  if (!signedInAddress) {
    return;
  }

  const next = payload?.toLowerCase() ?? null;

  if (next === signedInAddress.toLowerCase()) {
    return;
  }

  yield put(disconnectWallet());
  yield put(clearNfts());

  toast(
    next
      ? 'Wallet account changed — please sign in again.'
      : 'Wallet disconnected — please sign in again.',
    'warning',
  );
}

function* chainChangedSaga({payload}: ReturnType<typeof walletChainChanged>) {
  const {status} = yield select((state: RootState) => state.wallet);

  yield put(setChainId(payload));

  if (status === 'connecting' || status === 'signing') {
    return;
  }

  if (payload !== CHAIN_ID) {
    toast(`This app runs on ${CHAIN_NAME}. Switch networks to see your collection.`, 'warning');
  }
}

export function* walletSaga() {
  yield takeLatest(walletLinkRequest.type, walletLinkSaga);
  yield takeLatest(walletUnlinkRequest.type, walletUnlinkSaga);
  yield takeLatest(walletAccountChanged.type, accountChangedSaga);
  yield takeLatest(walletChainChanged.type, chainChangedSaga);
}
