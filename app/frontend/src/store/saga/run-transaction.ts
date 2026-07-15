import {channel, type Channel, type Task} from 'redux-saga';
import {call, cancel, cancelled, fork, put, take} from 'redux-saga/effects';
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
    onApproving: (hash?: string) => void;
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
      onApproving: (hash) => actions.put(txApproving(hash)),
    })) as TResult;

    yield put(txConfirmed(outcome));

    return result;
  } catch (error) {
    const message = explainTxError(error);
    const rejected = isRejection(error);

    yield put(txFailed({message, rejected}));

    return null;
  } finally {
    // takeLatest cancels this saga when the same action fires again. The underlying transaction is
    // already in the mempool and cannot be recalled, so leave the panel in a terminal state the
    // user can dismiss instead of a spinner frozen at 'pending' forever.
    if (yield cancelled()) {
      yield put(
        txFailed({
          message: 'This transaction was superseded by a newer one. Check your wallet for its status.',
          rejected: false,
        }),
      );
    }

    actions.close();
    yield cancel(pump);
  }
}
