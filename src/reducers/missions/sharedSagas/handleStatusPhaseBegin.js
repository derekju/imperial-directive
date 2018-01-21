// @flow

import {put, take} from 'redux-saga/effects';
import {STATUS_PHASE_BEGIN, statusPhaseBeginDone} from '../../mission';

// REQUIRED SAGA
export default function* handleStatusPhaseBegin(): Generator<*, *, *> {
  while (true) {
    yield take(STATUS_PHASE_BEGIN);
    yield put(statusPhaseBeginDone());
  }
}
