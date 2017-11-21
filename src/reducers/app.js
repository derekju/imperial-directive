// @flow

import {cancel, fork, put, select, take} from 'redux-saga/effects';
// import events from '../data/events';
// import {loadEvents} from './events';
import {loadMission} from './mission';
import missions from '../data/missions';
import type {StateType} from './types';

import {aftermath} from './missions/aftermath';

// Types

export type AppStateType = {
  currentMission: string,
  missionThreat: number,
};

// State

const initialState = {
  currentMission: '',
  missionThreat: 2,
};

export default (state: AppStateType = initialState, action: Function) => {
  switch (action.type) {
    case SET_MISSION:
      return {
        ...state,
        currentMission: action.payload.mission,
      };
    default:
      return state;
  }
};

// Action types

export const SET_MISSION = 'SET_MISSION';

// Action creators

export const setMission = (mission: string) => ({payload: {mission}, type: SET_MISSION});

// Selectors

export const getCurrentMission = (state: StateType) => state.app.currentMission;
export const getMissionThreat = (state: StateType) => state.app.missionThreat;

// Sagas

function* forkMission(currentMission: string): Generator<*, *, *> {
  switch (currentMission) {
    case 'aftermath':
      yield fork(aftermath);
      break;
    default:
      return;
  }
}

function* loadMissionSaga(): Generator<*, *, *> {
  let task = null;
  while (true) {
    const action = yield take(SET_MISSION);
    if (task) {
      yield cancel(task);
    }
    const {mission} = action.payload;
    const missionThreat = yield select(getMissionThreat);
    // Fork a copy of the saga for the current mission so we get mission specific logic
    const missionConfiguration = missions[mission];
    // Load the events
    // yield put(loadEvents(events.common));
    // Load our mission in which will kick things off
    yield put(loadMission(missionConfiguration, missionThreat));
    // Load the mission saga
    task = yield fork(forkMission, mission);
  }
}

export function* appSaga(): Generator<*, *, *> {
  yield fork(loadMissionSaga);
  const currentMission = yield select(getCurrentMission);
  if (Boolean(currentMission)) {
    const task = yield fork(forkMission, currentMission);
    yield take(SET_MISSION);
    yield cancel(task);
  }
}
