// @flow

import {cancel, fork, put, select, take} from 'redux-saga/effects';
import createAction from './createAction';
import {loadMission} from './mission';
import missions from '../data/missions';
import missionSagas from './missions';
import type {StateType} from './types';

// Constants

export const IMPERIAL_REWARDS = [
  'imperialIndustry',
  'oldWounds',
  'specialOperations',
  'supplyDeficit',
];

export const EXPANSIONS = ['twinShadows'];

// Types

export type AppStateType = {
  currentDifficulty: string,
  currentMission: string,
  expansions: {[string]: boolean},
  imperialRewards: {[string]: boolean},
  missionThreat: number,
};

// State

const initialState = {
  currentDifficulty: 'standard',
  currentMission: '',
  expansions: {},
  imperialRewards: {},
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
    case SET_DIFFICULTY:
      return {
        ...state,
        currentDifficulty: action.payload.difficulty,
      };
    case SET_IMPERIAL_REWARDS:
      return {
        ...state,
        imperialRewards: Object.assign({}, action.payload.rewards),
      };
    case SET_EXPANSIONS:
      return {
        ...state,
        expansions: Object.assign({}, action.payload.expansions),
      };
    default:
      return state;
  }
};

// Action types

export const SET_MISSION = 'SET_MISSION';
export const SET_MISSION_THREAT = 'SET_MISSION_THREAT';
export const SET_DIFFICULTY = 'SET_DIFFICULTY';
export const SET_IMPERIAL_REWARDS = 'SET_IMPERIAL_REWARDS';
export const SET_EXPANSIONS = 'SET_EXPANSIONS';
export const MISSION_SAGA_LOAD_DONE = 'MISSION_SAGA_LOAD_DONE';

// Action creators

export const setMission = (mission: string) => createAction(SET_MISSION, {mission});
export const setMissionThreat = (missionThreat: number) =>
  createAction(SET_MISSION_THREAT, {missionThreat});
export const setDifficulty = (difficulty: string) => createAction(SET_DIFFICULTY, {difficulty});
export const setImperialRewards = (rewards: Object) =>
  createAction(SET_IMPERIAL_REWARDS, {rewards});
export const setExpansions = (expansions: Object) => createAction(SET_EXPANSIONS, {expansions});
export const missionSagaLoadDone = () => createAction(MISSION_SAGA_LOAD_DONE);

// Selectors

export const getCurrentMission = (state: StateType) => state.app.currentMission;
export const getMissionThreat = (state: StateType) => state.app.missionThreat;
export const getDifficulty = (state: StateType) => state.app.currentDifficulty;
export const getImperialRewards = (state: StateType) => state.app.imperialRewards;
export const getExpansions = (state: StateType) => state.app.expansions;

// Sagas

function* forkMission(currentMission: string): Generator<*, *, *> {
  if (currentMission in missionSagas) {
    yield fork(missionSagas[currentMission]);
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
    const difficulty = yield select(getDifficulty);
    const expansions = yield select(getExpansions);
    // Fork a copy of the saga for the current mission so we get mission specific logic
    const missionConfiguration = missions[mission];
    // Load the events
    // yield put(loadEvents(events.common));
    // Load the mission saga
    task = yield fork(forkMission, mission);
    yield take(MISSION_SAGA_LOAD_DONE);
    // Load our mission in which will kick things off
    yield put(loadMission(missionConfiguration, missionThreat, difficulty, expansions));
  }
}

export function* appSaga(): Generator<*, *, *> {
  yield fork(loadMissionSaga);
}
