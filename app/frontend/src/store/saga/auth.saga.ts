import {call, put, takeLatest} from 'redux-saga/effects';

import {authApi, type IForgotResult} from '../../api/auth';
import {errorMessage, setAccessToken} from '../../api/client';
import {toast} from '../../components/Toastify';
import type {IUser} from '../../types/user';
import {revokeWalletAccess} from '../../web3/wallet';
import {
  bootstrapSession,
  forgotPasswordRequest,
  loginRequest,
  logoutRequest,
  registerRequest,
  resetPasswordRequest,
} from '../actions';
import {setForgotStatus, setResetCooldown, setResetStatus} from '../reducers/auth-slice';
import {clearNfts} from '../reducers/nft-slice';
import {setUser, setUserLoading, setVisitor} from '../reducers/user-slice';
import {disconnectWallet} from '../reducers/wallet-slice';

/**
 * Runs once on boot. With no access token in memory, /auth/me is answered from
 * the refresh cookie: the client interceptor spends it, retries, and the user
 * lands back in their session across a page reload.
 */
function* bootstrapSaga() {
  try {
    const user: IUser = yield call(authApi.me);
    yield put(setUser(user));
  } catch {
    // A failed session lookup means "not signed in" — never a dead-end spinner.
    yield put(setVisitor());
  }
}

function* loginSaga({payload}: ReturnType<typeof loginRequest>) {
  yield put(setUserLoading(true));

  try {
    const user: IUser = yield call(authApi.login, payload);
    yield put(setUser(user));
    toast('Signed in.', 'success');
  } catch (error) {
    yield put(setVisitor());
    toast(errorMessage(error, 'Could not sign you in'), 'error');
  }
}

function* registerSaga({payload}: ReturnType<typeof registerRequest>) {
  yield put(setUserLoading(true));

  try {
    const user: IUser = yield call(authApi.register, payload);
    yield put(setUser(user));
    toast('Welcome aboard.', 'success');
  } catch (error) {
    yield put(setVisitor());
    toast(errorMessage(error, 'Could not create your account'), 'error');
  }
}

function* logoutSaga() {
  try {
    yield call(authApi.logout);
  } catch (error) {
    toast(errorMessage(error, 'Could not sign you out'), 'error');
  } finally {
    // Whatever the server said, this browser is done with the session — and so
    // is the wallet. Leaving the site connected inside MetaMask after a sign-out
    // is exactly the kind of thing that looks fine until someone else sits down
    // at the machine.
    setAccessToken(null);
    yield put(setVisitor());
    yield put(disconnectWallet());
    yield put(clearNfts());
    yield call(revokeWalletAccess);
  }
}

function* forgotPasswordSaga({payload}: ReturnType<typeof forgotPasswordRequest>) {
  yield put(setForgotStatus('pending'));

  try {
    const result: IForgotResult = yield call(authApi.forgotPassword, payload);

    yield put(setResetCooldown(result.retryAfter));
    yield put(setForgotStatus('success'));
    toast(result.message, 'info', 8000);
  } catch (error) {
    // A refused attempt must not leave the button counting down forever.
    yield put(setResetCooldown(0));
    yield put(setForgotStatus('error'));
    toast(errorMessage(error), 'error');
  }
}

function* resetPasswordSaga({payload}: ReturnType<typeof resetPasswordRequest>) {
  yield put(setResetStatus('pending'));

  try {
    const message: string = yield call(authApi.resetPassword, payload);

    // The screen watches this to send the user to the sign-in form. Navigation
    // belongs to the component; the saga only reports what happened.
    yield put(setResetStatus('success'));
    toast(message, 'success');
  } catch (error) {
    yield put(setResetStatus('error'));
    toast(errorMessage(error), 'error');
  }
}

export function* authSaga() {
  // takeLatest, not takeEvery: double-clicking Sign in used to fire N logins.
  yield takeLatest(bootstrapSession.type, bootstrapSaga);
  yield takeLatest(loginRequest.type, loginSaga);
  yield takeLatest(registerRequest.type, registerSaga);
  yield takeLatest(logoutRequest.type, logoutSaga);
  yield takeLatest(forgotPasswordRequest.type, forgotPasswordSaga);
  yield takeLatest(resetPasswordRequest.type, resetPasswordSaga);
}
