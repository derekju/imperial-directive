// @flow

import {ACTIVATION_PHASE_BEGIN, increaseThreat} from './mission';
import {call, put, select, take} from 'redux-saga/effects';
import helperEventModal from './missions/helpers/helperEventModal';
import {getCurrentGroups} from './imperials';
import type {ImperialUnitType} from './imperials';

export function* handleSpecialOperationsReward(): Generator<*, *, *> {
  while (true) {
    yield take(ACTIVATION_PHASE_BEGIN);
    // Get all of the units that the imperial player has
    // Check if any of them have the leader attribute, if so, the imperial player gains one threat
    const currentGroups = yield select(getCurrentGroups);
    const {deployedGroups} = currentGroups;

    const leaderExists = deployedGroups.some((group: ImperialUnitType) => {
      return group.attributes.includes('leader');
    });

    if (leaderExists) {
      yield put(increaseThreat(1));
      yield call(helperEventModal, {
        text: ['The Imperial player has exhausted Special Operations to gain 1 threat.'],
        title: 'Special Operations',
      });
    }
  }
}
