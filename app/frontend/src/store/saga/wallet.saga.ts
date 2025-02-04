import type {JsonRpcSigner} from 'ethers';
import {call, put, takeLatest} from 'redux-saga/effects';

import {authApi} from '../../api/auth';
import {errorMessage} from '../../api/client';
import {toast} from '../../components/Toastify';
import type {IUser} from '../../types/user';
import {buildSiweMessage} from '../../web3/siwe';
import {
  CHAIN_ID,
  CHAIN_NAME,
  connectWallet,
  signMessage,
  switchChain,
  WalletError,
  type IWalletConnection,
} from '../../web3/wallet';
import {
  fetchNftsRequest,
  walletAccountChanged,
  walletChainChanged,
  walletLinkRequest,
  walletLoginRequest,
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

/**
 * The Sign-In with Ethereum handshake, end to end:
 *   connect → (switch network) → fetch a server nonce → sign it → send it back.
 *
 * Nothing is signed until the user has explicitly connected, and the nonce comes
 * from the server, so the signature we produce is worthless to anyone who
 * captures it — the backend burns the nonce on first use.
 */
function* signIn(): Generator<unknown, ISignedSiwe, never> {
  yield put(setWalletStatus('connecting'));

  const connection = (yield call(connectWallet)) as IWalletConnection;

  if (connection.chainId !== CHAIN_ID) {
    toast(`Switching your wallet to ${CHAIN_NAME}…`, 'info');
    yield call(switchChain, CHAIN_ID);
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
  const message =
    error instanceof WalletError ? error.message : errorMessage(error, 'Wallet sign-in failed');

  yield put(setWalletError(message));
  toast(message, 'error');
};

function* walletLoginSaga() {
  try {
    const signed: ISignedSiwe = yield call(signIn);
    const user: IUser = yield call(authApi.walletLogin, signed);

    yield put(setUser(user));
    yield put(setWalletStatus('connected'));
    yield put(fetchNftsRequest());

    toast('Wallet connected.', 'success');
  } catch (error) {
    yield* failed(error);
  }
}

function* walletLinkSaga() {
  try {
    const signed: ISignedSiwe = yield call(signIn);
    const user: IUser = yield call(authApi.walletLink, signed);

    yield put(setUser(user));
    yield put(setWalletStatus('connected'));
    yield put(fetchNftsRequest());

    toast('Wallet linked to your account.', 'success');
  } catch (error) {
    yield* failed(error);
  }
}

/** The user switched accounts (or disconnected) inside MetaMask itself. */
function* accountChangedSaga({payload}: ReturnType<typeof walletAccountChanged>) {
  if (!payload) {
    yield put(disconnectWallet());
    yield put(clearNfts());
    return;
  }

  // The signed-in session belongs to the previous address, so it is no longer
  // the one holding these NFTs — make the user prove the new one.
  yield put(disconnectWallet());
  yield put(clearNfts());
  toast('Wallet account changed — please sign in again.', 'warning');
}

function* chainChangedSaga({payload}: ReturnType<typeof walletChainChanged>) {
  yield put(setChainId(payload));

  if (payload !== CHAIN_ID) {
    toast(`This app runs on ${CHAIN_NAME}. Switch networks to see your collection.`, 'warning');
  }
}

export function* walletSaga() {
  yield takeLatest(walletLoginRequest.type, walletLoginSaga);
  yield takeLatest(walletLinkRequest.type, walletLinkSaga);
  yield takeLatest(walletAccountChanged.type, accountChangedSaga);
  yield takeLatest(walletChainChanged.type, chainChangedSaga);
}
