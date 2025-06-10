import {channel, type Channel, type Task} from 'redux-saga';
import {call, cancel, fork, put, take} from 'redux-saga/effects';
import type {Action} from '@reduxjs/toolkit';

import {explainTxError, isRejection} from '../../web3/transactions';
import {
  txApproving,
  txBroadcast,
  txConfirmed,
  txFailed,
  txGasEstimated,
  txStarted,
  type ITxKind,
} from '../reducers/tx-slice';

function* drain(actions: Channel<Action>) {
  while (true) {
    const action: Action = yield take(actions);
    yield put(action);
  }
}

export function* runTransaction<TResult>(
  kind: ITxKind,
  execute: (handlers: {
    onGasEstimated: (wei: string) => void;
    onBroadcast: (hash: string) => void;
    onApproving: () => void;
  }) => Promise<TResult>,
  outcome?: string,
): Generator<unknown, TResult | null, never> {
  const actions: Channel<Action> = channel<Action>();
  const pump = (yield fork(drain, actions)) as Task;

  yield put(txStarted(kind));

  try {
    const result = (yield call(execute, {
      onGasEstimated: (wei) => actions.put(txGasEstimated(wei)),
      onBroadcast: (value) => actions.put(txBroadcast(value)),
      onApproving: () => actions.put(txApproving()),
    })) as TResult;

    yield put(txConfirmed(outcome));

    return result;
  } catch (error) {
    const message = explainTxError(error);
    const rejected = isRejection(error);

    yield put(txFailed({message, rejected}));

    return null;
  } finally {
    actions.close();
    yield cancel(pump);
  }
}
