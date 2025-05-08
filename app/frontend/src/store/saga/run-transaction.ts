import {call, put} from 'redux-saga/effects';

import {toast} from '../../components/Toastify/toast';
import {explainTxError, isRejection} from '../../web3/transactions';
import {
  txBroadcast,
  txConfirmed,
  txFailed,
  txGasEstimated,
  txStarted,
  type ITxKind,
} from '../reducers/tx-slice';

export function* runTransaction<TResult>(
  kind: ITxKind,
  execute: (handlers: {
    onGasEstimated: (wei: string) => void;
    onBroadcast: (hash: string) => void;
  }) => Promise<TResult>,
): Generator<unknown, TResult | null, never> {
  const dispatched: {type: string; payload?: string}[] = [];

  yield put(txStarted(kind));

  try {
    const result = (yield call(execute, {
      onGasEstimated: (wei) => dispatched.push(txGasEstimated(wei)),
      onBroadcast: (value) => dispatched.push(txBroadcast(value)),
    })) as TResult;

    for (const action of dispatched) {
      yield put(action);
    }

    yield put(txConfirmed());

    return result;
  } catch (error) {
    for (const action of dispatched) {
      yield put(action);
    }

    const message = explainTxError(error);
    const rejected = isRejection(error);

    yield put(txFailed({message, rejected}));
    toast(message, rejected ? 'info' : 'error');

    return null;
  }
}
