// @flow

import {all, call, fork, put, select, take, takeEvery} from 'redux-saga/effects';
import {getIsThereReadyRebelFigures, SET_REBEL_HERO_ACTIVATED} from './rebels';
import {getReadyImperialGroups, SET_IMPERIAL_GROUP_ACTIVATED} from './imperials';
import type {StateType} from './types';

// Types

export type MissionStateType = {
  currentActivePlayer: number,
  currentPhase: number,
  currentRound: number,
  currentThreat: number,
  maxRounds: number,
  threatIncreasePerRound: number,
};

export type MissionConfigType = {
  initialGroups: string[],
  mapStates: string[],
  maxRounds: number,
  name: string,
  openGroups: number,
  reservedGroups: string[],
};

// Constants

export const PLAYER_NONE = 0;
export const PLAYER_REBELS = 1;
export const PLAYER_IMPERIALS = 2;

export const PHASE_EVENT = 0;
export const PHASE_ACTIVATION = 1;
export const PHASE_STATUS = 2;

// State

const initialState = {
  currentActivePlayer: PLAYER_REBELS,
  currentPhase: PHASE_EVENT,
  currentRound: 1,
  currentThreat: 0,
  maxRounds: 0,
  threatIncreasePerRound: 0,
};

export default (state: MissionStateType = initialState, action: Object) => {
  switch (action.type) {
    case LOAD_MISSION:
      const {config, threatIncreasePerRound} = action.payload;
      return {
        ...state,
        maxRounds: config.maxRounds,
        threatIncreasePerRound,
      };
    case CHANGE_PLAYER_TURN:
      return {
        ...state,
        currentActivePlayer: action.payload.player,
      };
    case ACTIVATION_PHASE_BEGIN:
      return {
        ...state,
        currentActivePlayer: PLAYER_REBELS,
      };
    case STATUS_PHASE_BEGIN:
      return {
        ...state,
        currentActivePlayer: PLAYER_NONE,
      };
    case STATUS_PHASE_INCREASE_THREAT:
      return {
        ...state,
        currentThreat: state.currentThreat + state.threatIncreasePerRound,
      };
    case STATUS_PHASE_DEPLOY_REINFORCE_DONE:
      return {
        ...state,
        currentThreat: action.payload.newThreat,
      };
    case STATUS_PHASE_ADVANCE_ROUND:
      return {
        ...state,
        currentRound: state.currentRound + 1,
      };
    // case MISSION_TURN_END:
    //   return {
    //     ...state,
    //     currentActivePlayer:
    //       state.currentActivePlayer === PLAYER_HERO ? PLAYER_IMPERIAL : PLAYER_HERO,
    //     currentRound: state.currentRound + 1,
    //     currentThreat: state.currentThreat + state.threatIncreasePerRound,
    //   };
    default:
      return state;
  }
};

// Action types

export const LOAD_MISSION = 'LOAD_MISSION';
export const CHANGE_PLAYER_TURN = 'CHANGE_PLAYER_TURN';
export const ACTIVATION_PHASE_BEGIN = 'ACTIVATION_PHASE_BEGIN';
export const STATUS_PHASE_BEGIN = 'STATUS_PHASE_BEGIN';
export const STATUS_PHASE_INCREASE_THREAT = 'STATUS_PHASE_INCREASE_THREAT';
export const STATUS_PHASE_READY_GROUPS = 'STATUS_PHASE_READY_GROUPS';
export const STATUS_PHASE_DEPLOY_REINFORCE = 'STATUS_PHASE_DEPLOY_REINFORCE';
export const STATUS_PHASE_DEPLOY_REINFORCE_DONE = 'STATUS_PHASE_DEPLOY_REINFORCE_DONE';
export const STATUS_PHASE_END_ROUND_EFFECTS = 'STATUS_PHASE_END_ROUND_EFFECTS';
export const STATUS_PHASE_END_ROUND_EFFECTS_DONE = 'STATUS_PHASE_END_ROUND_EFFECTS_DONE';
export const STATUS_PHASE_ADVANCE_ROUND = 'STATUS_PHASE_ADVANCE_ROUND';

// Action creators

export const loadMission = (config: MissionConfigType, threatIncreasePerRound: number) => ({
  payload: {config, threatIncreasePerRound},
  type: LOAD_MISSION,
});
export const changePlayerTurn = (player: number) => ({payload: {player}, type: CHANGE_PLAYER_TURN});
export const activationPhaseBegin = () => ({type: ACTIVATION_PHASE_BEGIN});
export const statusPhaseBegin = () => ({type: STATUS_PHASE_BEGIN});
export const statusPhaseIncreaseThreat = () => ({type: STATUS_PHASE_INCREASE_THREAT});
export const statusPhaseReadyGroups = () => ({type: STATUS_PHASE_READY_GROUPS});
export const statusPhaseDeployReinforce = () => ({type: STATUS_PHASE_DEPLOY_REINFORCE});
export const statusPhaseDeployReinforceDone = (newThreat: number) => ({
  payload: {newThreat},
  type: STATUS_PHASE_DEPLOY_REINFORCE_DONE,
});
export const statusPhaseEndRoundEffects = () => ({type: STATUS_PHASE_END_ROUND_EFFECTS});
export const statusPhaseAdvanceRound = () => ({type: STATUS_PHASE_ADVANCE_ROUND});

// Selectors

export const isRebelPlayerTurn = (state: StateType) =>
  state.mission.currentActivePlayer === PLAYER_REBELS;
export const isImperialPlayerTurn = (state: StateType) =>
  state.mission.currentActivePlayer === PLAYER_IMPERIALS;
export const getCurrentThreat = (state: StateType) => state.mission.currentThreat;
export const getCurrentRound = (state: StateType) => state.mission.currentRound;

// Sagas

function* handleLoadMission(action: Object): Generator<*, *, *> {
  // const {config} = action.payload;
  yield put(activationPhaseBegin());
}

function* missionEndOfTurn(): Generator<*, *, *> {
  yield put(statusPhaseBegin());
  yield put(statusPhaseIncreaseThreat());
  yield put(statusPhaseReadyGroups());
  yield put(statusPhaseDeployReinforce());
  yield take(STATUS_PHASE_DEPLOY_REINFORCE_DONE);
  // TODO: This is going to be dependent on what mission the user is on so gonna
  // need that forked mission saga probably
  yield put(statusPhaseEndRoundEffects());
  // yield take(STATUS_PHASE_END_ROUND_EFFECTS_DONE);
  yield put(statusPhaseAdvanceRound()); // TODO: Check hit max round
  // yield take(STATUS_PHASE_ADVANCE_ROUND_DONE);
}

function* handleEndOfRebelOrImperialTurn(action: Object): Generator<*, *, *> {
  while (true) {
    const action = yield take([SET_REBEL_HERO_ACTIVATED, SET_IMPERIAL_GROUP_ACTIVATED]);

    // Can no one take anymore actions?
    const imperialGroups = yield select(getReadyImperialGroups);
    const imperialGroupsCanMove = Boolean(imperialGroups.length);
    const rebelFiguresCanMove = yield select(getIsThereReadyRebelFigures);

    if (!imperialGroupsCanMove && !rebelFiguresCanMove) {
      yield call(missionEndOfTurn);
    } else if (action.type === SET_REBEL_HERO_ACTIVATED) {
      if (imperialGroupsCanMove) {
        yield put(changePlayerTurn(PLAYER_IMPERIALS));
      }
    } else {
      if (rebelFiguresCanMove) {
        yield put(changePlayerTurn(PLAYER_REBELS));
      }
    }
  }
}

export function* missionSaga(): Generator<*, *, *> {
  yield all([takeEvery(LOAD_MISSION, handleLoadMission), fork(handleEndOfRebelOrImperialTurn)]);
}
