// @flow

import {all, call, put, select, takeEvery} from 'redux-saga/effects';
import {
  CHANGE_PLAYER_TURN,
  getCurrentThreat,
  LOAD_MISSION,
  PLAYER_IMPERIALS,
  statusPhaseDeployReinforceDone,
  STATUS_PHASE_DEPLOY_REINFORCE,
  STATUS_PHASE_READY_GROUPS,
} from './mission';
import {getDifficulty, getMissionThreat} from './app';
import {SET_REBEL_ESCAPED, SET_REBEL_ACTIVATED} from './rebels';
import createAction from './createAction';
import decrementFigureFromGroup from './utils/decrementFigureFromGroup';
import {displayModal} from './modal';
import filter from 'lodash/filter';
import last from 'lodash/last';
import populateOpenGroups from './utils/populateOpenGroups';
import random from 'lodash/random';
import reverse from 'lodash/reverse';
import sortBy from 'lodash/sortBy';
import type {StateType} from './types';
import units from '../data/units';
import waitForModal from '../sagas/waitForModal';
import without from 'lodash/without';

// Constants

const MINIMUM_THREAT_TO_DO_DEPLOYMENT = 4;

// Types

export type DesignationMapType = {[id: string]: number[]};

export type ImperialUnitCommandType = {
  condition: string,
  command: string,
};

export type UnitConfigType = {
  affiliation: string,
  attributes: string[],
  buffs: string[],
  commands: ImperialUnitCommandType[],
  eligibleForHpBoost: boolean,
  elite: boolean,
  hpBoosts: {[threatLevel: string]: number[]},
  id: string,
  maxDeployed: number,
  maxInGroup: number,
  name: string,
  reinforcementCost: number,
  threat: number,
  unique: boolean,
};

export type ImperialUnitType = {
  affiliation: string,
  attributes: string[],
  buffs: string[],
  commands: ImperialUnitCommandType[],
  currentNumFigures: number,
  elite: boolean,
  exhausted: boolean,
  groupNumber: number,
  hpBoost: number,
  id: string,
  maxInGroup: number,
  name: string,
  reinforcementCost: number,
  threat: number,
};

export type ImperialsStateType = {
  activatedGroup: ?ImperialUnitType,
  customAI: ?(Object[]),
  customAIExceptionList: string[],
  deployedGroups: ImperialUnitType[],
  designationMap: DesignationMapType,
  interruptedGroup: ?ImperialUnitType,
  openGroups: ImperialUnitType[],
};

// Utils

const determineHpBoost = (
  hpBoosts: {[threat: string]: number[]},
  missionThreat: number,
  difficulty
) => {
  const boostArray = hpBoosts[String(missionThreat)];
  const randomNumber = random(0, boostArray.length - 1);
  return boostArray[randomNumber] + (difficulty === 'experienced' ? random(0, 2) : 0);
};

const createNewGroup = (
  id: string,
  designationMap: DesignationMapType,
  missionThreat: number,
  difficulty: string
): ImperialUnitType => {
  // Default to 1
  let groupNumber = 1;
  // Look in our designation map to see if this unit exists, if so, we need to change the number
  if (id in designationMap) {
    // It exists, find the lowest free number e.g. if we have [1, 3, 4, 6], we need to set this
    // group to 2
    let gapExists = false;
    const sortedGroups = designationMap[id].sort((a: number, b: number) => a - b);
    for (let i = 0; i < sortedGroups.length; i++) {
      if (i + 1 === sortedGroups[i]) {
        continue;
      } else {
        gapExists = true;
        groupNumber = i + 1;
        designationMap[id].push(groupNumber);
        break;
      }
    }
    // If we didn't find a gap, just use the highest number
    if (gapExists === false) {
      groupNumber = sortedGroups.length + 1;
      designationMap[id].push(groupNumber);
    }
    // If not, add it
  } else {
    designationMap[id] = [1];
  }

  return {
    ...units[id],
    currentNumFigures: units[id].maxInGroup,
    exhausted: false,
    groupNumber,
    hpBoost: units[id].eligibleForHpBoost
      ? determineHpBoost(units[id].hpBoosts, missionThreat, difficulty)
      : 0,
  };
};

// State

const initialState = {
  activatedGroup: null,
  customAI: null,
  customAIExceptionList: [],
  deployedGroups: [],
  designationMap: {},
  interruptedGroup: null,
  openGroups: [],
};

export default (state: ImperialsStateType = initialState, action: Object) => {
  switch (action.type) {
    case LOAD_MISSION:
      const {config, difficulty, missionThreat} = action.payload;
      const designationMap = {};
      return {
        ...initialState,
        customAI: state.customAI,
        customAIExceptionList: state.customAIExceptionList,
        deployedGroups: config.initialGroups.map((id: string) =>
          createNewGroup(id, designationMap, missionThreat, difficulty)
        ),
        designationMap,
        openGroups: populateOpenGroups(config, missionThreat),
      };
    case ACTIVATE_IMPERIAL_GROUP: {
      const {group} = action.payload;
      return {
        ...state,
        activatedGroup: group,
      };
    }
    case SILENT_SET_IMPERIAL_GROUP_ACTIVATED: {
      const {group} = action.payload;
      return {
        ...state,
        deployedGroups: state.deployedGroups.map((deployedGroup: ImperialUnitType) => {
          if (deployedGroup.id === group.id && deployedGroup.groupNumber === group.groupNumber) {
            deployedGroup.exhausted = true;
          }
          return deployedGroup;
        }),
      };
    }
    case SET_IMPERIAL_GROUP_ACTIVATED: {
      const {group} = action.payload;
      return {
        ...state,
        activatedGroup: null,
        deployedGroups: state.deployedGroups.map((deployedGroup: ImperialUnitType) => {
          if (deployedGroup.id === group.id && deployedGroup.groupNumber === group.groupNumber) {
            deployedGroup.exhausted = true;
          }
          return deployedGroup;
        }),
      };
    }
    case SET_IMPERIAL_GROUP_UNACTIVATED: {
      const {group} = action.payload;
      return {
        ...state,
        activatedGroup: null,
        deployedGroups: state.deployedGroups.map((deployedGroup: ImperialUnitType) => {
          if (deployedGroup.id === group.id && deployedGroup.groupNumber === group.groupNumber) {
            deployedGroup.exhausted = false;
          }
          return deployedGroup;
        }),
      };
    }
    case SET_IMPERIAL_FIGURES_AFTER_DEFEAT: {
      const {deployedGroups, groupToDecrement, openGroups} = action.payload;

      return {
        ...state,
        deployedGroups,
        designationMap: {
          ...state.designationMap,
          [groupToDecrement.id]:
            groupToDecrement.currentNumFigures === 1
              ? without(state.designationMap[groupToDecrement.id], groupToDecrement.groupNumber)
              : state.designationMap[groupToDecrement.id],
        },
        openGroups: state.openGroups.concat(openGroups),
      };
    }
    case SET_IMPERIAL_FIGURES_AFTER_DEPLOY_REINFORCE: {
      const {
        difficulty,
        groupsToDeploy,
        groupsToReinforce,
        missionThreat,
        newOpenGroups,
      } = action.payload;

      // We're mutating state.designationMap here!
      return {
        ...state,
        deployedGroups: state.deployedGroups
          .map((deployedGroup: ImperialUnitType) => {
            const matchingGroups = groupsToReinforce.filter(
              (groupToReinforce: {groupNumber: number, id: string}) =>
                groupToReinforce.groupNumber === deployedGroup.groupNumber &&
                groupToReinforce.id === deployedGroup.id
            );

            if (matchingGroups.length) {
              deployedGroup.currentNumFigures += matchingGroups.length;
            }
            return deployedGroup;
          })
          .concat(
            groupsToDeploy.map((id: string) =>
              createNewGroup(id, state.designationMap, missionThreat, difficulty)
            )
          ),
        openGroups: newOpenGroups,
      };
    }
    case STATUS_PHASE_READY_GROUPS:
      return {
        ...state,
        activatedGroup: null,
        deployedGroups: state.deployedGroups.map((deployedGroup: ImperialUnitType) => {
          deployedGroup.exhausted = false;
          return deployedGroup;
        }),
      };
    case DEPLOY_NEW_GROUPS: {
      const {difficulty, groupIds, missionThreat} = action.payload;
      // We're mutating state.designationMap here!
      return {
        ...state,
        deployedGroups: state.deployedGroups.concat(
          groupIds.map((id: string) =>
            createNewGroup(id, state.designationMap, missionThreat, difficulty)
          )
        ),
      };
    }
    case SET_INTERRUPTED_GROUP:
      return {
        ...state,
        interruptedGroup: action.payload.group,
      };
    case SET_CUSTOM_AI:
      return {
        ...state,
        customAI: action.payload.customAI,
        customAIExceptionList: action.payload.exceptionList,
      };
    case CLEAR_CUSTOM_AI:
      return {
        ...state,
        customAI: initialState.customAI,
        customAIExceptionList: initialState.customAIExceptionList,
      };
    case SET_IMPERIAL_UNIT_HP_BUFF:
      const {groupId, hpBuff} = action.payload;
      return {
        ...state,
        deployedGroups: state.deployedGroups.map((deployedGroup: ImperialUnitType) => {
          if (deployedGroup.id === groupId) {
            deployedGroup.hpBoost = hpBuff;
          }
          return deployedGroup;
        }),
      };
    default:
      return state;
  }
};

// Action types

export const SET_IMPERIAL_GROUP_ACTIVATED = 'SET_IMPERIAL_GROUP_ACTIVATED';
export const SILENT_SET_IMPERIAL_GROUP_ACTIVATED = 'SILENT_SET_IMPERIAL_GROUP_ACTIVATED';
export const SET_IMPERIAL_GROUP_UNACTIVATED = 'SET_IMPERIAL_GROUP_UNACTIVATED';
export const ACTIVATE_IMPERIAL_GROUP = 'ACTIVATE_IMPERIAL_GROUP';
export const DEFEAT_IMPERIAL_FIGURE = 'DEFEAT_IMPERIAL_FIGURE';
export const SET_IMPERIAL_FIGURES_AFTER_DEFEAT = 'SET_IMPERIAL_FIGURES_AFTER_DEFEAT';
export const SET_IMPERIAL_FIGURES_AFTER_DEPLOY_REINFORCE =
  'SET_IMPERIAL_FIGURES_AFTER_DEPLOY_REINFORCE';
export const DEPLOY_NEW_GROUPS = 'DEPLOY_NEW_GROUPS';
export const SET_INTERRUPTED_GROUP = 'SET_INTERRUPTED_GROUP';
export const OPTIONAL_DEPLOYMENT = 'OPTIONAL_DEPLOYMENT';
export const OPTIONAL_DEPLOYMENT_DONE = 'OPTIONAL_DEPLOYMENT_DONE';
export const SET_CUSTOM_AI = 'SET_CUSTOM_AI';
export const CLEAR_CUSTOM_AI = 'CLEAR_CUSTOM_AI';
export const SET_IMPERIAL_UNIT_HP_BUFF = 'SET_IMPERIAL_UNIT_HP_BUFF';

// Action creators

export const setImperialGroupActivated = (group: ImperialUnitType) => ({
  payload: {group},
  type: SET_IMPERIAL_GROUP_ACTIVATED,
});
export const silentSetImperialGroupActivated = (group: ImperialUnitType) => ({
  payload: {group},
  type: SILENT_SET_IMPERIAL_GROUP_ACTIVATED,
});
export const setImperialGroupUnactivated = (group: ImperialUnitType) => ({
  payload: {group},
  type: SET_IMPERIAL_GROUP_UNACTIVATED,
});
export const activateImperialGroup = (group: ImperialUnitType) => ({
  payload: {group},
  type: ACTIVATE_IMPERIAL_GROUP,
});
export const defeatImperialFigure = (group: ImperialUnitType) => ({
  payload: {group},
  type: DEFEAT_IMPERIAL_FIGURE,
});
export const setImperialFiguresAfterDefeat = (
  deployedGroups: ImperialUnitType[],
  openGroups: ImperialUnitType[],
  groupToDecrement: ImperialUnitType
) => ({
  payload: {deployedGroups, groupToDecrement, openGroups},
  type: SET_IMPERIAL_FIGURES_AFTER_DEFEAT,
});
export const setImperialFiguresAfterDeployReinforce = (
  groupsToDeploy: string[],
  groupsToReinforce: Array<{groupNumber: number, id: string}>,
  newOpenGroups: ImperialUnitType[],
  missionThreat: number,
  difficulty: string
) => ({
  payload: {difficulty, groupsToDeploy, groupsToReinforce, missionThreat, newOpenGroups},
  type: SET_IMPERIAL_FIGURES_AFTER_DEPLOY_REINFORCE,
});
export const deployNewGroups = (groupIds: string[], missionThreat: number, difficulty: string) => ({
  payload: {difficulty, groupIds, missionThreat},
  type: DEPLOY_NEW_GROUPS,
});
export const setInterruptedGroup = (group: ImperialUnitType) => ({
  payload: {group},
  type: SET_INTERRUPTED_GROUP,
});
export const setInterruptedGroupActivated = () =>
  createAction(SET_INTERRUPTED_GROUP, {group: null});
export const optionalDeployment = () => createAction(OPTIONAL_DEPLOYMENT);
export const optionalDeploymentDone = (newThreat: number) =>
  createAction(OPTIONAL_DEPLOYMENT_DONE, {newThreat});
export const setCustomAI = (customAI: ?(Object[]), exceptionList: string[] = []) =>
  createAction(SET_CUSTOM_AI, {customAI, exceptionList});
export const clearCustomAI = () => createAction(CLEAR_CUSTOM_AI);
export const setImperialUnitHpBuff = (groupId: string, hpBuff: number) =>
  createAction(SET_IMPERIAL_UNIT_HP_BUFF, {groupId, hpBuff});

// Selectors

export const getReadyImperialGroups = (state: StateType) =>
  filter(state.imperials.deployedGroups, {exhausted: false});
export const getExhaustedImperialGroups = (state: StateType) =>
  filter(state.imperials.deployedGroups, {exhausted: true});
export const getCurrentGroups = (state: StateType) => ({
  deployedGroups: state.imperials.deployedGroups,
  openGroups: state.imperials.openGroups,
});
export const isGroupIdInDeployedGroups = (state: StateType, id: string) =>
  Boolean(state.imperials.deployedGroups.find((group: ImperialUnitType) => group.id === id));
export const getDeployedGroupOfIdWithMostUnits = (state: StateType, id: string) =>
  last(
    sortBy(
      state.imperials.deployedGroups.filter((group: ImperialUnitType) => group.id === id),
      'currentNumFigures'
    )
  );
export const getLastDeployedGroupOfId = (state: StateType, id: string): ImperialUnitType =>
  last(state.imperials.deployedGroups.filter((group: ImperialUnitType) => group.id === id));

// Sagas

function* handleOptionalDeployment(): Generator<*, *, *> {
  let currentThreat = yield select(getCurrentThreat);
  const {openGroups} = yield select(getCurrentGroups);

  let newOpenGroups = [];
  const groupsToDeploy = [];

  // We should spend our threat on the highest cost deployments

  // Sort the open groups array by highest to lowest threat
  // Iterate and pull groups off until we cannot do so anymore
  const sortedOpenGroups = reverse(sortBy(openGroups, (unit: ImperialUnitType) => unit.threat));

  let i = 0;
  for (i; i < sortedOpenGroups.length; i++) {
    if (currentThreat >= sortedOpenGroups[i].threat) {
      // Just push the ID, we don't need all the other metadata
      groupsToDeploy.push(sortedOpenGroups[i].id);
      currentThreat -= sortedOpenGroups[i].threat;
      break;
    } else {
      // If the threat cost of the group is higher than the current threat,
      // add it onto newOpenGroups so we can update our openGroups state
      newOpenGroups.push(sortedOpenGroups[i]);
    }
  }

  newOpenGroups = newOpenGroups.concat(sortedOpenGroups.slice(i + 1));

  yield put(displayModal('STATUS_REINFORCEMENT', {groupsToDeploy, groupsToReinforce: []}));
  yield call(waitForModal('STATUS_REINFORCEMENT'));

  const missionThreat = yield select(getMissionThreat);
  const difficulty = yield select(getDifficulty);
  yield put(
    setImperialFiguresAfterDeployReinforce(
      groupsToDeploy,
      [],
      newOpenGroups,
      missionThreat,
      difficulty
    )
  );

  yield put(optionalDeploymentDone(currentThreat));
}

function* handleDeployAndReinforcement(): Generator<*, *, *> {
  let currentThreat = yield select(getCurrentThreat);
  const {deployedGroups, openGroups} = yield select(getCurrentGroups);

  let newOpenGroups = [];
  const groupsToDeploy = [];
  const groupsToReinforce = [];

  // Ok, we have all the information we need so figure out how we are going to do this
  // We should spend our threat on the highest cost deployments and use the rest of the threat
  // to reinforce
  // UPDATE: ONLY do deployment if our current threat is greater than MINIMUM_THREAT_TO_DO_DEPLOYMENT
  // This is so we don't continually burn threat when we get new threat from status phase on low
  // cost support units like the Imperial Officer or Probe Droid. Essentially, bank threat until
  // we can bring out something better. This is a pretty lame way to do this but partially fixes
  // the problem...
  if (currentThreat >= MINIMUM_THREAT_TO_DO_DEPLOYMENT && openGroups.length) {
    // Sort the open groups array by highest to lowest threat
    // Iterate and pull groups off until we cannot do so anymore
    const sortedOpenGroups = reverse(sortBy(openGroups, (unit: ImperialUnitType) => unit.threat));

    for (let i = 0; i < sortedOpenGroups.length; i++) {
      if (currentThreat >= sortedOpenGroups[i].threat) {
        // Just push the ID, we don't need all the other metadata
        groupsToDeploy.push(sortedOpenGroups[i].id);
        currentThreat -= sortedOpenGroups[i].threat;
      } else {
        // If the threat cost of the group is higher than the current threat,
        // add it onto newOpenGroups so we can update our openGroups state
        newOpenGroups.push(sortedOpenGroups[i]);
      }
    }
  } else {
    newOpenGroups = newOpenGroups.concat(openGroups);
  }

  // If we have leftover threat, reinforce
  // Not worth it to implement a strategy here so just do it in readyGroup order until
  // we use up all of the threat
  if (currentThreat > 0) {
    for (let i = 0; i < deployedGroups.length; i++) {
      let unitsMissing = deployedGroups[i].maxInGroup - deployedGroups[i].currentNumFigures;
      const threatNeededToReinforce = deployedGroups[i].reinforcementCost;
      while (unitsMissing > 0 && currentThreat >= threatNeededToReinforce) {
        groupsToReinforce.push({
          groupNumber: deployedGroups[i].groupNumber,
          id: deployedGroups[i].id,
        });
        currentThreat -= threatNeededToReinforce;
        unitsMissing--;
      }
    }
  }

  yield put(displayModal('STATUS_REINFORCEMENT', {groupsToDeploy, groupsToReinforce}));
  yield call(waitForModal('STATUS_REINFORCEMENT'));

  const missionThreat = yield select(getMissionThreat);
  const difficulty = yield select(getDifficulty);
  yield put(
    setImperialFiguresAfterDeployReinforce(
      groupsToDeploy,
      groupsToReinforce,
      newOpenGroups,
      missionThreat,
      difficulty
    )
  );

  yield put(statusPhaseDeployReinforceDone(currentThreat));
}

function* handleImperialFigureDefeat(action: Object): Generator<*, *, *> {
  const {group: groupToDecrement} = action.payload;
  const {deployedGroups} = yield select(getCurrentGroups);

  const groupsToAddToOpen = [];

  const newDeployedGroups = decrementFigureFromGroup(
    groupToDecrement,
    deployedGroups,
    groupsToAddToOpen
  );

  yield put(setImperialFiguresAfterDefeat(newDeployedGroups, groupsToAddToOpen, groupToDecrement));
}

function* handleImperialActivation(): Generator<*, *, *> {
  // Figure out which group we are activating
  const readyGroups = yield select(getReadyImperialGroups);

  if (readyGroups.length) {
    const randomNumber = random(0, readyGroups.length - 1);
    const randomGroup = readyGroups[randomNumber];

    // Set them as activated
    yield put(activateImperialGroup(randomGroup));
  }
}

export function* imperialsSaga(): Generator<*, *, *> {
  yield all([
    takeEvery(
      (action: Object) =>
        action.type === CHANGE_PLAYER_TURN && action.payload.player === PLAYER_IMPERIALS,
      handleImperialActivation
    ),
    takeEvery(DEFEAT_IMPERIAL_FIGURE, handleImperialFigureDefeat),
    takeEvery(STATUS_PHASE_DEPLOY_REINFORCE, handleDeployAndReinforcement),
    takeEvery(OPTIONAL_DEPLOYMENT, handleOptionalDeployment),
  ]);
}
