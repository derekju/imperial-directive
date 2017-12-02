// @flow

import {cancel, fork, put, select, take} from 'redux-saga/effects';
// import events from '../data/events';
// import {loadEvents} from './events';
import {loadMission} from './mission';
import missions from '../data/missions';
import type {StateType} from './types';

import {aftermath} from './missions/aftermath';
import {aNewThreat} from './missions/aNewThreat';
import {aSimpleTask} from './missions/aSimpleTask';
import {brushfire} from './missions/brushfire';
import {captured} from './missions/captured';
import {luxuryCruise} from './missions/luxuryCruise';
import {temptation} from './missions/temptation';
import {underSiege} from './missions/underSiege';
// import {friendsOfOld} from './missions/friendsOfOld';

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
    case SET_MISSION_THREAT:
      return {
        ...state,
        missionThreat: action.payload.missionThreat,
      };
    default:
      return state;
  }
};

// Action types

export const SET_MISSION = 'SET_MISSION';
export const SET_MISSION_THREAT = 'SET_MISSION_THREAT';
export const MISSION_SAGA_LOAD_DONE = 'MISSION_SAGA_LOAD_DONE';

// Action creators

export const setMission = (mission: string) => ({payload: {mission}, type: SET_MISSION});
export const setMissionThreat = (missionThreat: number) => ({
  payload: {missionThreat},
  type: SET_MISSION_THREAT,
});
export const missionSagaLoadDone = () => ({type: MISSION_SAGA_LOAD_DONE});

// Selectors

export const getCurrentMission = (state: StateType) => state.app.currentMission;
export const getMissionThreat = (state: StateType) => state.app.missionThreat;

// Sagas

function* forkMission(currentMission: string): Generator<*, *, *> {
  switch (currentMission) {
    case 'aftermath':
      yield fork(aftermath);
      break;
    case 'aNewThreat':
      yield fork(aNewThreat);
      break;
    case 'aSimpleTask':
      yield fork(aSimpleTask);
      break;
    case 'brushfire':
      yield fork(brushfire);
      break;
    case 'captured':
      yield fork(captured);
      break;
    case 'luxuryCruise':
      yield fork(luxuryCruise);
      break;
    case 'temptation':
      yield fork(temptation);
      break;
    case 'underSiege':
      yield fork(underSiege);
      break;
    // case 'friendsOfOld':
    //   yield fork(friendsOfOld);
    //   break;
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
    // Load the mission saga
    task = yield fork(forkMission, mission);
    yield take(MISSION_SAGA_LOAD_DONE);
    // Load our mission in which will kick things off
    yield put(loadMission(missionConfiguration, missionThreat));
  }
}

export function* appSaga(): Generator<*, *, *> {
  yield fork(loadMissionSaga);
}
