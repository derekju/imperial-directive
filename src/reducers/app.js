// @flow

import {all, cancel, fork, put, select, take} from 'redux-saga/effects';
import createAction from './createAction';
import {getVillains} from './imperials';
import {loadMission} from './mission';
import missions from '../data/missions';
import missionSagas from './missions';
import {setRoster} from './rebels';
import type {StateType} from './types';

// Constants

export const IMPERIAL_REWARDS = [
  {id: 'bounty', name: 'Bounty'},
  {id: 'imperialIndustry', name: 'Imperial Industry'},
  {id: 'oldWounds', name: 'Old Wounds'},
  {id: 'specialOperations', name: 'Special Operations'},
  {id: 'supplyDeficit', name: 'Supply Deficit'},
];

export const REBEL_REWARDS = ['counterparts'];

export const EXPANSIONS = ['twinShadows'];

// Types

export type AppStateType = {
  currentDifficulty: string,
  currentMission: string,
  expansions: {[string]: boolean},
  imperialRewards: {[string]: boolean},
  missionThreat: number,
  rebelRewards: {[string]: boolean},
  threatReduction: number,
};

// State

const initialState = {
  currentDifficulty: 'standard',
  currentMission: '',
  expansions: {},
  imperialRewards: {},
  missionThreat: 2,
  rebelRewards: {},
  threatReduction: 0,
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
    case SET_REBEL_REWARDS:
      return {
        ...state,
        rebelRewards: Object.assign({}, action.payload.rewards),
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
    case SET_THREAT_REDUCTION:
      return {
        ...state,
        threatReduction: action.payload.threatReduction,
      };
    default:
      return state;
  }
};

// Action types

export const SET_MISSION = 'SET_MISSION';
export const SET_MISSION_THREAT = 'SET_MISSION_THREAT';
export const SET_DIFFICULTY = 'SET_DIFFICULTY';
export const SET_REBEL_REWARDS = 'SET_REBEL_REWARDS';
export const SET_IMPERIAL_REWARDS = 'SET_IMPERIAL_REWARDS';
export const SET_EXPANSIONS = 'SET_EXPANSIONS';
export const MISSION_SAGA_LOAD_DONE = 'MISSION_SAGA_LOAD_DONE';
export const SET_THREAT_REDUCTION = 'SET_THREAT_REDUCTION';

// Action creators

export const setMission = (mission: string) => createAction(SET_MISSION, {mission});
export const setMissionThreat = (missionThreat: number) =>
  createAction(SET_MISSION_THREAT, {missionThreat});
export const setDifficulty = (difficulty: string) => createAction(SET_DIFFICULTY, {difficulty});
export const setRebelRewards = (rewards: Object) => createAction(SET_REBEL_REWARDS, {rewards});
export const setImperialRewards = (rewards: Object) =>
  createAction(SET_IMPERIAL_REWARDS, {rewards});
export const setExpansions = (expansions: Object) => createAction(SET_EXPANSIONS, {expansions});
export const missionSagaLoadDone = () => createAction(MISSION_SAGA_LOAD_DONE);
export const setThreatReduction = (threatReduction: number) =>
  createAction(SET_THREAT_REDUCTION, {threatReduction});

// Selectors

export const getRouterState = (state: StateType) => state.router;
export const getCurrentMission = (state: StateType) => state.app.currentMission;
export const getMissionThreat = (state: StateType) => state.app.missionThreat;
export const getDifficulty = (state: StateType) => state.app.currentDifficulty;
export const getRebelRewards = (state: StateType) => state.app.rebelRewards;
export const getImperialRewards = (state: StateType) => state.app.imperialRewards;
export const getExpansions = (state: StateType) => state.app.expansions;
export const getThreatReduction = (state: StateType) => state.app.threatReduction;

// Sagas

function* forkMission(currentMission: string): Generator<*, *, *> {
  if (currentMission in missionSagas) {
    yield fork(missionSagas[currentMission]);
  }
}

function* handleUrlHydrationSaga(): Generator<*, *, *> {
  const {location} = yield select(getRouterState);
  const match = location.pathname.match(/^\/mission\/(.*)$/);
  if (match && match.length === 2) {
    // Rehydrate defaults until we have actual persistence
    yield put(setRoster(['diala']));
    yield put(setMissionThreat(5));
    // Rehydrate mission name
    yield put(setMission(match[1]));
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
    const villains = yield select(getVillains);
    const imperialRewards = yield select(getImperialRewards);
    // Fork a copy of the saga for the current mission so we get mission specific logic
    const missionConfiguration = missions[mission];
    // Load the events
    // yield put(loadEvents(events.common));
    // Load the mission saga
    task = yield fork(forkMission, mission);
    yield take(MISSION_SAGA_LOAD_DONE);
    // Load our mission in which will kick things off
    yield put(
      loadMission(
        missionConfiguration,
        missionThreat,
        difficulty,
        expansions,
        villains,
        imperialRewards
      )
    );
  }
}

export function* appSaga(): Generator<*, *, *> {
  yield all([fork(loadMissionSaga), fork(handleUrlHydrationSaga)]);
}
