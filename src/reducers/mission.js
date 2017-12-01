// @flow

import {all, call, fork, put, select, take, takeEvery} from 'redux-saga/effects';
import {
  getIsThereReadyRebelFigures,
  getRoster,
  SET_REBEL_ESCAPED,
  SET_REBEL_HERO_ACTIVATED,
} from './rebels';
import {
  getReadyImperialGroups,
  OPTIONAL_DEPLOYMENT_DONE,
  SET_IMPERIAL_GROUP_ACTIVATED,
  triggerImperialActivation,
} from './imperials';
import createAction from './createAction';
import {displayModal} from './modal';
import type {StateType} from './types';
import waitForModal from '../sagas/waitForModal';

// Types

export type MapStateType = {
  activated: boolean,
  activateText: string,
  color?: string,
  coordinates: {x: number, y: number},
  description: string,
  id: number,
  interactable: boolean,
  offset?: boolean,
  type: string,
  unactivateText: string,
  visible: boolean,
};

export type MissionStateType = {
  attackTarget: string,
  currentActivePlayer: number,
  currentPhase: number,
  currentRound: number,
  currentThreat: number,
  deploymentPoint: string,
  instructions: {imperialVictory: string, rebelVictory: string},
  mapImage: Array<Array<string>>,
  mapStates: {[key: string]: MapStateType},
  moveTarget: string,
  missionThreat: number,
};

export type MissionConfigType = {
  initialGroups: string[],
  instructions: {imperialVictory: string, rebelVictory: string},
  mapImage: Array<Array<string>>,
  mapStates: {[key: string]: MapStateType},
  name: string,
  openGroups: number,
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
  attackTarget: 'the closest unwounded hero',
  currentActivePlayer: PLAYER_NONE,
  currentPhase: PHASE_EVENT,
  currentRound: 1,
  currentThreat: 0,
  deploymentPoint: 'The green deployment point closest to the most hostile figures',
  instructions: {
    imperialVictory: '',
    rebelVictory: '',
  },
  mapImage: [[]],
  mapStates: {},
  missionThreat: 0,
  moveTarget: 'the closest unwounded hero',
};

export default (state: MissionStateType = initialState, action: Object) => {
  switch (action.type) {
    case LOAD_MISSION:
      const {config, missionThreat} = action.payload;
      return {
        ...initialState,
        attackTarget: state.attackTarget, // Set by individual mission saga
        deploymentPoint: state.deploymentPoint, // Set by individual mission saga
        instructions: config.instructions,
        mapImage: config.mapImage,
        mapStates: config.mapStates,
        missionThreat,
        moveTarget: state.moveTarget,
      };
    case CHANGE_PLAYER_TURN:
      return {
        ...state,
        currentActivePlayer: action.payload.player,
      };
    case SET_MAP_STATE_ACTIVATED: {
      const {id, type, value} = action.payload;
      const key = `${type}-${id}`;
      return {
        ...state,
        mapStates: {
          ...state.mapStates,
          [key]: {
            ...state.mapStates[key],
            activated: value,
          },
        },
      };
    }
    case SET_MAP_STATE_INTERACTABLE: {
      const {id, type, value} = action.payload;
      const key = `${type}-${id}`;
      return {
        ...state,
        mapStates: {
          ...state.mapStates,
          [key]: {
            ...state.mapStates[key],
            interactable: value,
          },
        },
      };
    }
    case SET_MAP_STATE_VISIBLE: {
      const {id, type, value} = action.payload;
      const key = `${type}-${id}`;
      return {
        ...state,
        mapStates: {
          ...state.mapStates,
          [key]: {
            ...state.mapStates[key],
            visible: value,
          },
        },
      };
    }
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
        currentThreat: state.currentThreat + state.missionThreat,
      };
    case STATUS_PHASE_DEPLOY_REINFORCE_DONE:
    case OPTIONAL_DEPLOYMENT_DONE:
      return {
        ...state,
        currentThreat: action.payload.newThreat,
      };
    case STATUS_PHASE_ADVANCE_ROUND:
      return {
        ...state,
        currentRound: state.currentRound + 1,
      };
    case SET_ATTACK_TARGET:
      return {
        ...state,
        attackTarget: action.payload.attackTarget,
      };
    case SET_MOVE_TARGET:
      return {
        ...state,
        moveTarget: action.payload.moveTarget,
      };
    case SET_DEPLOYMENT_POINT:
      return {
        ...state,
        deploymentPoint: action.payload.deploymentPoint,
      };
    case INCREASE_THREAT:
      return {
        ...state,
        currentThreat: state.currentThreat + action.payload.threat,
      };
    default:
      return state;
  }
};

// Action types

export const LOAD_MISSION = 'LOAD_MISSION';
export const CHANGE_PLAYER_TURN = 'CHANGE_PLAYER_TURN';
export const EVENT_PHASE_BEGIN = 'EVENT_PHASE_BEGIN';
export const EVENT_PHASE_END = 'EVENT_PHASE_END';
export const ACTIVATION_PHASE_BEGIN = 'ACTIVATION_PHASE_BEGIN';
export const SET_MAP_STATE_ACTIVATED = 'SET_MAP_STATE_ACTIVATED';
export const SET_MAP_STATE_INTERACTABLE = 'SET_MAP_STATE_INTERACTABLE';
export const SET_MAP_STATE_VISIBLE = 'SET_MAP_STATE_VISIBLE';
export const STATUS_PHASE_BEGIN = 'STATUS_PHASE_BEGIN';
export const STATUS_PHASE_INCREASE_THREAT = 'STATUS_PHASE_INCREASE_THREAT';
export const STATUS_PHASE_READY_GROUPS = 'STATUS_PHASE_READY_GROUPS';
export const STATUS_PHASE_DEPLOY_REINFORCE = 'STATUS_PHASE_DEPLOY_REINFORCE';
export const STATUS_PHASE_DEPLOY_REINFORCE_DONE = 'STATUS_PHASE_DEPLOY_REINFORCE_DONE';
export const STATUS_PHASE_END_ROUND_EFFECTS = 'STATUS_PHASE_END_ROUND_EFFECTS';
export const STATUS_PHASE_END_ROUND_EFFECTS_DONE = 'STATUS_PHASE_END_ROUND_EFFECTS_DONE';
export const STATUS_PHASE_ADVANCE_ROUND = 'STATUS_PHASE_ADVANCE_ROUND';
export const SET_ATTACK_TARGET = 'SET_ATTACK_TARGET';
export const SET_MOVE_TARGET = 'SET_MOVE_TARGET';
export const SET_DEPLOYMENT_POINT = 'SET_DEPLOYMENT_POINT';
export const MISSION_SPECIAL_SETUP = 'MISSION_SPECIAL_SETUP';
export const MISSION_SPECIAL_SETUP_DONE = 'MISSION_SPECIAL_SETUP_DONE';
export const INCREASE_THREAT = 'INCREASE_THREAT';

// Action creators

export const loadMission = (config: MissionConfigType, missionThreat: number) =>
  createAction(LOAD_MISSION, {config, missionThreat});
export const changePlayerTurn = (player: number) => createAction(CHANGE_PLAYER_TURN, {player});
export const setMapStateActivated = (id: number, type: string, value: boolean) =>
  createAction(SET_MAP_STATE_ACTIVATED, {id, type, value});
export const setMapStateInteractable = (id: number, type: string, value: boolean) =>
  createAction(SET_MAP_STATE_INTERACTABLE, {id, type, value});
export const setMapStateVisible = (id: number, type: string, value: boolean) =>
  createAction(SET_MAP_STATE_VISIBLE, {id, type, value});
export const eventPhaseBegin = () => createAction(EVENT_PHASE_BEGIN);
export const eventPhaseEnd = () => createAction(EVENT_PHASE_END);
export const activationPhaseBegin = () => createAction(ACTIVATION_PHASE_BEGIN);
export const statusPhaseBegin = () => createAction(STATUS_PHASE_BEGIN);
export const statusPhaseIncreaseThreat = () => createAction(STATUS_PHASE_INCREASE_THREAT);
export const statusPhaseReadyGroups = () => createAction(STATUS_PHASE_READY_GROUPS);
export const statusPhaseDeployReinforce = () => createAction(STATUS_PHASE_DEPLOY_REINFORCE);
export const statusPhaseDeployReinforceDone = (newThreat: number) =>
  createAction(STATUS_PHASE_DEPLOY_REINFORCE_DONE, {newThreat});
export const statusPhaseEndRoundEffects = () => createAction(STATUS_PHASE_END_ROUND_EFFECTS);
export const statusPhaseEndRoundEffectsDone = () =>
  createAction(STATUS_PHASE_END_ROUND_EFFECTS_DONE);
export const statusPhaseAdvanceRound = () => createAction(STATUS_PHASE_ADVANCE_ROUND);
export const setAttackTarget = (attackTarget: string) =>
  createAction(SET_ATTACK_TARGET, {attackTarget});
export const setMoveTarget = (moveTarget: string) => createAction(SET_MOVE_TARGET, {moveTarget});
export const setDeploymentPoint = (deploymentPoint: string) =>
  createAction(SET_DEPLOYMENT_POINT, {deploymentPoint});
export const missionSpecialSetupDone = () => createAction(MISSION_SPECIAL_SETUP_DONE);
export const missionSpecialSetup = () => createAction(MISSION_SPECIAL_SETUP);
export const increaseThreat = (threat: number) => createAction(INCREASE_THREAT, {threat});

// Selectors

export const isRebelPlayerTurn = (state: StateType) =>
  state.mission.currentActivePlayer === PLAYER_REBELS;
export const isImperialPlayerTurn = (state: StateType) =>
  state.mission.currentActivePlayer === PLAYER_IMPERIALS;
export const getCurrentThreat = (state: StateType) => state.mission.currentThreat;
export const getCurrentRound = (state: StateType) => state.mission.currentRound;
export const getMapStates = (state: StateType) => state.mission.mapStates;

// Sagas

function* handleCheckForThreeHeroes(): Generator<*, *, *> {
  const roster = yield select(getRoster);
  const numHeroes = roster ? roster.length : 1;
  // Need to ask which hero we want to set for double activation
  if (numHeroes === 3) {
    yield put(displayModal('HEROIC_HERO_MODAL'));
    yield call(waitForModal('HEROIC_HERO_MODAL'));
  }
}

function* handleLoadMission(): Generator<*, *, *> {
  // yield put(eventPhaseBegin());
  // yield take(EVENT_PHASE_END);
  // Blocking call to let mission figure out any special setup needed
  yield put(missionSpecialSetup());
  yield take(MISSION_SPECIAL_SETUP_DONE);
  yield call(handleCheckForThreeHeroes);
  yield put(activationPhaseBegin());
}

function* missionEndOfTurn(): Generator<*, *, *> {
  yield put(statusPhaseBegin());
  yield put(statusPhaseIncreaseThreat());
  yield put(statusPhaseReadyGroups());
  yield put(statusPhaseDeployReinforce());
  yield take(STATUS_PHASE_DEPLOY_REINFORCE_DONE);
  yield put(statusPhaseEndRoundEffects());
  // The individual mission sagas MUST put this effect, otherwise the game will stall!!!
  yield take(STATUS_PHASE_END_ROUND_EFFECTS_DONE);
  yield put(statusPhaseAdvanceRound());
  const currentRound = yield select(getCurrentRound);
  yield put(displayModal('BEGIN_ROUND', {currentRound}));
  yield call(waitForModal('BEGIN_ROUND'));
  yield call(handleCheckForThreeHeroes);
  yield put(activationPhaseBegin());
}

function* handleEndOfRebelOrImperialTurn(action: Object): Generator<*, *, *> {
  while (true) {
    const action = yield take([
      SET_REBEL_HERO_ACTIVATED,
      SET_REBEL_ESCAPED,
      SET_IMPERIAL_GROUP_ACTIVATED,
    ]);

    // Can no one take anymore actions?
    const imperialGroups = yield select(getReadyImperialGroups);
    const imperialGroupsCanMove = Boolean(imperialGroups.length);
    const rebelFiguresCanMove = yield select(getIsThereReadyRebelFigures);

    if (!imperialGroupsCanMove && !rebelFiguresCanMove) {
      yield call(missionEndOfTurn);
    } else if ([SET_REBEL_HERO_ACTIVATED, SET_REBEL_ESCAPED].includes(action.type)) {
      if (imperialGroupsCanMove) {
        yield put(changePlayerTurn(PLAYER_IMPERIALS));
      }
    } else {
      if (rebelFiguresCanMove) {
        yield put(changePlayerTurn(PLAYER_REBELS));
      } else {
        // Rebels can't do anything anymore so just activate the next imperial troop
        yield put(triggerImperialActivation());
      }
    }
  }
}

export function* missionSaga(): Generator<*, *, *> {
  yield all([takeEvery(LOAD_MISSION, handleLoadMission), fork(handleEndOfRebelOrImperialTurn)]);
}
