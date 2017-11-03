// @flow

import {put, select} from 'redux-saga/effects';
import {loadMission} from './mission';
import missions from '../data/missions';

// State

const initialState = {
  selectedMission: 'aftermath',
  threatIncreasePerRound: 2,
};

export default (state: Object = initialState, action: Function) => {
  return state;
};

export function* appSaga(): Generator<*, *, *> {
  const selectedMission = yield select(state => state.app.selectedMission);
  const threatIncreasePerRound = yield select(state => state.app.threatIncreasePerRound);
  const missionConfiguration = missions[selectedMission];
  yield put(loadMission(missionConfiguration, threatIncreasePerRound));
}
