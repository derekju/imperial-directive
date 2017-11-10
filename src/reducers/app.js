// @flow

import {fork, put, select} from 'redux-saga/effects';
import type {StateType} from './types';
import {loadMission} from './mission';
import missions from '../data/missions';

import {aftermath} from './missions/aftermath';

// Types

export type AppStateType = {
  currentMission: string,
  threatIncreasePerRound: number,
};

// State

const initialState = {
  currentMission: 'aftermath',
  threatIncreasePerRound: 2,
};

export default (state: AppStateType = initialState, action: Function) => {
  return state;
};

function* forkMission(currentMission: string): Generator<*, *, *> {
  switch (currentMission) {
    case 'aftermath':
      yield fork(aftermath);
      break;
    default:
      return;
  }
}

export function* appSaga(): Generator<*, *, *> {
  const currentMission = yield select((state: StateType) => state.app.currentMission);
  const threatIncreasePerRound = yield select(
    (state: StateType) => state.app.threatIncreasePerRound
  );
  const missionConfiguration = missions[currentMission];

  // Fork a copy of the saga for the current mission so we get mission specific logic
  yield fork(forkMission, currentMission);
  // Load our mission in which will kick things off
  yield put(loadMission(missionConfiguration, threatIncreasePerRound));
}
