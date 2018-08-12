// @flow

import {all, call, fork, put, select, spawn, take, takeEvery} from 'redux-saga/effects';
import {
  getAllyChosen,
  getIsThereReadyRebelFigures,
  getRosterOfType,
  SET_REBEL_ACTIVATED,
  SET_REBEL_ESCAPED,
} from './rebels';
import {getImperialRewards, getThreatReduction} from './app';
import {
  getReadyImperialGroups,
  OPTIONAL_DEPLOYMENT_DONE,
  optionalDeployment,
  SET_IMPERIAL_GROUP_ACTIVATED,
} from './imperials';
import createAction from './createAction';
import {displayModal} from './modal';
import {handleSpecialOperationsReward} from './imperialRewards';
import helperEventModal from './missions/helpers/helperEventModal';
import rebels from '../data/rebels.json';
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
  difficulty: string,
  disableThreatIncrease: boolean,
  extraThreatIncrease: number,
  instructions: {imperialVictory: string, rebelVictory: string},
  mapImage: Array<Array<string>>,
  mapStates: {[key: string]: MapStateType},
  moveTarget: string,
  missionThreat: number,
  withdrawnHeroCanActivate: boolean,
};

export type MissionConfigType = {
  initialGroups: string[],
  instructions: {imperialVictory: string, rebelVictory: string},
  mapImage: Array<Array<string>>,
  mapStates: {[key: string]: MapStateType},
  name: string,
  noAllowedAttributes?: string[],
  noMercenaryAllowed: boolean,
  openGroups: number,
  openGroupsCustom?: string[],
  reservedGroups: string[],
  wave?: string,
  withdrawnHeroCanActivate?: boolean,
};

// Constants

export const PLAYER_NONE = 0;
export const PLAYER_REBELS = 1;
export const PLAYER_IMPERIALS = 2;

export const PHASE_EVENT = 0;
export const PHASE_ACTIVATION = 1;
export const PHASE_STATUS = 2;

export const DIFFICULTY_THREAT_INCREASE = {
  '2': 1,
  '3': 2,
  '4': 2,
  '5': 3,
  '6': 3,
};

// State

export const initialState = {
  attackTarget: 'the closest unwounded hero',
  currentActivePlayer: PLAYER_NONE,
  currentPhase: PHASE_EVENT,
  currentRound: 1,
  currentThreat: 0,
  deploymentPoint: 'The green deployment point closest to the most hostile figures',
  difficulty: 'standard',
  disableThreatIncrease: false,
  extraThreatIncrease: 0,
  instructions: {
    imperialVictory: '',
    rebelVictory: '',
  },
  mapImage: [[]],
  mapStates: {},
  missionThreat: 0,
  moveTarget: 'the closest unwounded hero',
  withdrawnHeroCanActivate: false,
};

export default (state: MissionStateType = initialState, action: Object) => {
  switch (action.type) {
    case LOAD_MISSION:
      const {config, difficulty, missionThreat} = action.payload;
      return {
        ...initialState,
        attackTarget: state.attackTarget, // Set by individual mission saga
        deploymentPoint: state.deploymentPoint, // Set by individual mission saga
        difficulty,
        instructions: config.instructions,
        mapImage: config.mapImage,
        mapStates: config.mapStates,
        missionThreat,
        moveTarget: state.moveTarget,
        withdrawnHeroCanActivate: config.withdrawnHeroCanActivate || false,
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
      if (state.disableThreatIncrease) {
        return state;
      }

      const extraThreatToAdd =
        state.difficulty === 'experienced'
          ? DIFFICULTY_THREAT_INCREASE[String(state.missionThreat)]
          : 0;
      return {
        ...state,
        currentThreat:
          state.currentThreat + state.missionThreat + state.extraThreatIncrease + extraThreatToAdd,
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
    case UPDATE_REBEL_VICTORY:
      return {
        ...state,
        instructions: {
          ...state.instructions,
          rebelVictory: action.payload.newText,
        },
      };
    case UPDATE_IMPERIAL_VICTORY:
      return {
        ...state,
        instructions: {
          ...state.instructions,
          imperialVictory: action.payload.newText,
        },
      };
    case DISABLE_THREAT_INCREASE:
      return {
        ...state,
        disableThreatIncrease: true,
      };
    case SET_EXTRA_THREAT_INCREASE:
      return {
        ...state,
        extraThreatIncrease: action.payload.increase,
      };
    case UPDATE_MAP_IMAGE:
      // updateData is an array of data of rows and columns do update e.g.
      // [[row, column start, [...data]], [row, column start, [...data]]]
      const {updateData} = action.payload;

      // Need to make a copy of the map image
      let newMapImage = [];
      for (let i = 0; i < state.mapImage.length; i++) {
        // $FlowFixMe
        newMapImage.push(state.mapImage[i].slice());
      }

      for (let x = 0; x < updateData.length; x++) {
        const dataPacket = updateData[x];
        const [row, column, data] = dataPacket;
        // Now actually replace the map
        for (let i = 0; i < data.length; i++) {
          newMapImage[row][column + i] = data[i];
        }
      }
      return {
        ...state,
        mapImage: newMapImage,
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
export const STATUS_PHASE_BEGIN_DONE = 'STATUS_PHASE_BEGIN_DONE';
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
export const UPDATE_REBEL_VICTORY = 'UPDATE_REBEL_VICTORY';
export const UPDATE_IMPERIAL_VICTORY = 'UPDATE_IMPERIAL_VICTORY';
export const DISABLE_THREAT_INCREASE = 'DISABLE_THREAT_INCREASE';
export const SET_EXTRA_THREAT_INCREASE = 'SET_EXTRA_THREAT_INCREASE';
export const UPDATE_MAP_IMAGE = 'UPDATE_MAP_IMAGE';

// Action creators

export const loadMission = (
  config: MissionConfigType,
  missionThreat: number,
  difficulty: string,
  expansions: {[string]: boolean},
  villains: {[string]: boolean}
) => createAction(LOAD_MISSION, {config, difficulty, expansions, missionThreat, villains});
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
export const statusPhaseBeginDone = () => createAction(STATUS_PHASE_BEGIN_DONE);
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
export const updateRebelVictory = (newText: string) =>
  createAction(UPDATE_REBEL_VICTORY, {newText});
export const updateImperialVictory = (newText: string) =>
  createAction(UPDATE_IMPERIAL_VICTORY, {newText});
export const disableThreatIncrease = () => createAction(DISABLE_THREAT_INCREASE);
export const setExtraThreatIncrease = (increase: number) =>
  createAction(SET_EXTRA_THREAT_INCREASE, {increase});
export const updateMapImage = (updateData: Array<Array<*>>) =>
  createAction(UPDATE_MAP_IMAGE, {updateData});

// Selectors

export const isRebelPlayerTurn = (state: StateType) =>
  state.mission.currentActivePlayer === PLAYER_REBELS;
export const isImperialPlayerTurn = (state: StateType) =>
  state.mission.currentActivePlayer === PLAYER_IMPERIALS;
export const getCurrentThreat = (state: StateType) => state.mission.currentThreat;
export const getCurrentRound = (state: StateType) => state.mission.currentRound;
export const getMapStates = (state: StateType) => state.mission.mapStates;
export const getDeploymentPoint = (state: StateType) => state.mission.deploymentPoint;

// Sagas

function* handleCheckForThreeHeroes(): Generator<*, *, *> {
  const roster = yield select(getRosterOfType, 'hero');
  const numHeroes = roster ? roster.length : 1;
  // Need to ask which hero we want to set for double activation
  if (numHeroes === 3) {
    yield put(displayModal('HEROIC_HERO_MODAL'));
    yield call(waitForModal('HEROIC_HERO_MODAL'));
  }
}

function* handleCheckForAllies(): Generator<*, *, *> {
  const allyChosen = yield select(getAllyChosen);
  if (allyChosen) {
    // Increase threat by the cost of the ally chosen
    const ally = rebels[allyChosen];
    // Decrease by threat reduction
    const threatReduction = yield select(getThreatReduction);
    const threatCost = ally.threat - threatReduction;

    // Show a modal if there was an actual reduction
    if (threatReduction > 0) {
      yield call(helperEventModal, {
        text: [`The cost to deploy an ally was reduced by ${threatReduction}.`],
        title: 'Threat Reduction',
      });
    }

    yield call(helperEventModal, {
      text: [
        'Because an ally was chosen, the Imperial receives extra threat.',
        'The threat has been increased and an optional deployment will now be done.',
      ],
      title: 'Initial Setup',
    });
    // Double current threat
    yield put(increaseThreat(threatCost));
    // Do optional deployment
    yield put(optionalDeployment());
    yield take(OPTIONAL_DEPLOYMENT_DONE);
  }
}

function* handleCheckForImperialRewards(): Generator<*, *, *> {
  // If any of the rewards are toggled, we need to handle them one by one
  // There's not really an elegant way to do this so just check them one by one
  const imperialRewards = yield select(getImperialRewards);
  if (imperialRewards.supplyDeficit) {
    yield call(helperEventModal, {
      text: [
        'The Imperial player has earned the Supply Deficit reward.',
        'You may choose to spend 100 credits. If you do not, each hero suffers 2 {STRAIN}.',
      ],
      title: 'Supply Deficit',
    });
  }

  if (imperialRewards.oldWounds) {
    yield call(helperEventModal, {
      text: [
        'The Imperial player has earned the Old Wounds reward.',
        'When a wounded hero is attacking, apply -1 {DAMAGE} to the attack results.',
      ],
      title: 'Old Wounds',
    });
  }

  if (imperialRewards.specialOperations) {
    yield call(helperEventModal, {
      text: [
        'The Imperial player has earned the Special Operations reward.',
        'As long as the Imperial player has a Leader unit deployed at the beginning of the round, they will automatically gain 1 threat at the beginning of each round.',
      ],
      title: 'Special Operations',
    });
    yield spawn(handleSpecialOperationsReward);
  }

  if (imperialRewards.imperialIndustry) {
    yield call(helperEventModal, {
      text: [
        'The Imperial player has earned the Imperial Industry reward.',
        'The bonus will be randomly applied to a unit each turn.',
      ],
      title: 'Imperial Industry',
    });
  }
}

function* handleLoadMission(): Generator<*, *, *> {
  // Blocking call to let mission figure out any special setup needed
  yield put(missionSpecialSetup());
  yield take(MISSION_SPECIAL_SETUP_DONE);
  yield call(handleCheckForAllies);
  yield call(handleCheckForThreeHeroes);
  yield call(handleCheckForImperialRewards);
  yield put(activationPhaseBegin());
}

function* missionEndOfTurn(): Generator<*, *, *> {
  yield put(statusPhaseBegin());
  yield take(STATUS_PHASE_BEGIN_DONE);
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
      SET_REBEL_ACTIVATED,
      SET_REBEL_ESCAPED,
      SET_IMPERIAL_GROUP_ACTIVATED,
    ]);

    // Can no one take anymore actions?
    const imperialGroups = yield select(getReadyImperialGroups);
    const imperialGroupsCanMove = Boolean(imperialGroups.length);
    const rebelFiguresCanMove = yield select(getIsThereReadyRebelFigures);

    if (!imperialGroupsCanMove && !rebelFiguresCanMove) {
      yield call(missionEndOfTurn);
    } else if ([SET_REBEL_ACTIVATED, SET_REBEL_ESCAPED].includes(action.type)) {
      if (imperialGroupsCanMove) {
        yield put(changePlayerTurn(PLAYER_IMPERIALS));
      }
    } else {
      if (rebelFiguresCanMove) {
        yield put(changePlayerTurn(PLAYER_REBELS));
      } else {
        // Rebels can't do anything anymore so just activate the next imperial troop
        yield put(changePlayerTurn(PLAYER_IMPERIALS));
      }
    }
  }
}

export function* missionSaga(): Generator<*, *, *> {
  yield all([takeEvery(LOAD_MISSION, handleLoadMission), fork(handleEndOfRebelOrImperialTurn)]);
}
