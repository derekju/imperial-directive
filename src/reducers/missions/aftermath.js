// @flow

import {all, fork, select, take} from 'redux-saga/effects';
import {getCurrentRound, STATUS_PHASE_END_ROUND_EFFECTS} from '../mission';

// Sagas

function* handleLockDownEvent(): Generator<*, *, *> {
  while (true) {
    yield take(STATUS_PHASE_END_ROUND_EFFECTS);
    const currentRound = yield select(getCurrentRound);

    if (currentRound === 1) {
      // Trigger Lockdown

      // Break since we don't want to do this again
      break;
    }
  }
}

function* handleDoorOpenEvent(): Generator<*, *, *> {
  // TODO
}

function* handleEndOfMission(): Generator<*, *, *> {
  while (true) {
    yield take(STATUS_PHASE_END_ROUND_EFFECTS);
    const currentRound = yield select(getCurrentRound);

    if (currentRound === 6) {
      // End game with imperial victory

      // Break since we don't want to do this again
      break;
    }
  }
}

export function* aftermath(): Generator<*, *, *> {
  yield all([fork(handleLockDownEvent), fork(handleDoorOpenEvent), fork(handleEndOfMission)]);
}
