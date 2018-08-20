// @flow

import {all, call, put, select, takeEvery} from 'redux-saga/effects';
import {
  CHANGE_PLAYER_TURN,
  getCurrentThreat,
  LOAD_MISSION,
  PLAYER_IMPERIALS,
  STATUS_PHASE_DEPLOY_REINFORCE,
  STATUS_PHASE_END_ROUND_EFFECTS,
  STATUS_PHASE_READY_GROUPS,
  statusPhaseDeployReinforceDone,
} from './mission';
import createAction from './createAction';
import decrementFigureFromGroup from './utils/decrementFigureFromGroup';
import {displayModal} from './modal';
import filter from 'lodash/filter';
import helperDeployGroupInteractive from './missions/helpers/helperDeployGroupInteractive';
import last from 'lodash/last';
import omit from 'lodash/omit';
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
  expansion?: string,
  habitat?: string,
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
  alias: {color: string, number: number},
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
  unique: boolean,
};

export type ImperialsStateType = {
  activatedGroup: ?ImperialUnitType,
  customAI: ?(Object[]),
  customAIExceptionList: string[],
  customUnitAI: {[string]: Object[]},
  deployedGroups: ImperialUnitType[],
  designationMap: DesignationMapType,
  interruptedGroup: ?ImperialUnitType,
  openGroups: ImperialUnitType[],
  villains: string[],
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

export const createNewGroup = (
  id: string,
  designationMap: DesignationMapType,
  missionThreat: number,
  difficulty: string,
  aliasColor: string,
  aliasNumber: number,
  imperialRewards: {[string]: boolean}
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
    alias: {
      color: aliasColor,
      number: aliasNumber,
    },
    currentNumFigures: units[id].maxInGroup,
    exhausted: false,
    groupNumber,
    hpBoost: units[id].eligibleForHpBoost
      ? determineHpBoost(units[id].hpBoosts, missionThreat, difficulty)
      : 0,
    threat:
      units[id].attributes.includes('hunter') && imperialRewards.bounty
        ? units[id].threat - 1
        : units[id].threat,
  };
};

// State

export const initialState = {
  activatedGroup: null,
  customAI: null,
  customAIExceptionList: [],
  customUnitAI: {},
  deployedGroups: [],
  designationMap: {},
  interruptedGroup: null,
  openGroups: [],
  villains: [],
};

export default (state: ImperialsStateType = initialState, action: Object) => {
  switch (action.type) {
    case LOAD_MISSION:
      const {config, expansions, imperialRewards, missionThreat, villains} = action.payload;
      return {
        ...initialState,
        customAI: state.customAI,
        customAIExceptionList: state.customAIExceptionList,
        customUnitAI: state.customUnitAI,
        openGroups: populateOpenGroups(
          config,
          units,
          missionThreat,
          expansions,
          villains,
          imperialRewards
        ),
        villains: state.villains,
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
        deployedGroups: (state.deployedGroups.map((deployedGroup: ImperialUnitType) => {
          if (deployedGroup.id === group.id && deployedGroup.groupNumber === group.groupNumber) {
            deployedGroup.exhausted = true;
          }
          return deployedGroup;
        }): ImperialUnitType[]),
      };
    }
    case SET_IMPERIAL_GROUP_ACTIVATED: {
      const {group} = action.payload;
      return {
        ...state,
        activatedGroup: null,
        deployedGroups: (state.deployedGroups.map((deployedGroup: ImperialUnitType) => {
          if (deployedGroup.id === group.id && deployedGroup.groupNumber === group.groupNumber) {
            deployedGroup.exhausted = true;
          }
          return deployedGroup;
        }): ImperialUnitType[]),
      };
    }
    case SET_IMPERIAL_GROUP_UNACTIVATED: {
      const {group} = action.payload;
      return {
        ...state,
        activatedGroup: null,
        deployedGroups: (state.deployedGroups.map((deployedGroup: ImperialUnitType) => {
          if (deployedGroup.id === group.id && deployedGroup.groupNumber === group.groupNumber) {
            deployedGroup.exhausted = false;
          }
          return deployedGroup;
        }): ImperialUnitType[]),
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
        openGroups: (state.openGroups.concat(openGroups): ImperialUnitType[]),
      };
    }
    case SET_IMPERIAL_FIGURES_AFTER_DEPLOY_REINFORCE: {
      const {groupsToReinforce, newOpenGroups} = action.payload;

      // We're mutating state.designationMap here!
      return {
        ...state,
        deployedGroups: (state.deployedGroups.map((deployedGroup: ImperialUnitType) => {
          const matchingGroups = groupsToReinforce.filter(
            (groupToReinforce: {groupNumber: number, id: string}) =>
              groupToReinforce.groupNumber === deployedGroup.groupNumber &&
              groupToReinforce.id === deployedGroup.id
          );

          if (matchingGroups.length) {
            deployedGroup.currentNumFigures += matchingGroups.length;
          }
          return deployedGroup;
        }): ImperialUnitType[]),
        openGroups: newOpenGroups,
      };
    }
    case STATUS_PHASE_READY_GROUPS:
      return {
        ...state,
        activatedGroup: null,
        deployedGroups: (state.deployedGroups.map((deployedGroup: ImperialUnitType) => {
          deployedGroup.exhausted = false;
          return deployedGroup;
        }): ImperialUnitType[]),
      };
    case DEPLOY_NEW_GROUPS: {
      const {
        aliasColor,
        aliasNumber,
        difficulty,
        groupIds,
        imperialRewards,
        missionThreat,
      } = action.payload;
      // We're mutating state.designationMap here!

      return {
        ...state,
        deployedGroups: (state.deployedGroups.concat(
          groupIds.map((id: string) =>
            createNewGroup(
              id,
              state.designationMap,
              missionThreat,
              difficulty,
              aliasColor,
              aliasNumber,
              imperialRewards
            )
          )
        ): ImperialUnitType[]),
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
        deployedGroups: (state.deployedGroups.map((deployedGroup: ImperialUnitType) => {
          if (deployedGroup.id === groupId) {
            deployedGroup.hpBoost = hpBuff;
          }
          return deployedGroup;
        }): ImperialUnitType[]),
      };
    case SET_CUSTOM_UNIT_AI: {
      const {commands, unit} = action.payload;
      return {
        ...state,
        customUnitAI: {
          ...state.customUnitAI,
          [unit]: commands.slice(),
        },
      };
    }
    case CLEAR_CUSTOM_UNIT_AI: {
      const {unit} = action.payload;
      return {
        ...state,
        customUnitAI: omit(state.customUnitAI, unit),
      };
    }
    case SET_VILLAINS:
      return {
        ...state,
        villains: action.payload.villains,
      };
    case REMOVE_FROM_OPEN_GROUPS:
      return {
        ...state,
        // $FlowFixMe
        openGroups: state.openGroups.filter(
          (group: ImperialUnitType) => group.id !== action.payload.groupId
        ),
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
export const SET_CUSTOM_UNIT_AI = 'SET_CUSTOM_UNIT_AI';
export const CLEAR_CUSTOM_UNIT_AI = 'CLEAR_CUSTOM_UNIT_AI';
export const SET_VILLAINS = 'SET_VILLAINS';
export const REMOVE_FROM_OPEN_GROUPS = 'REMOVE_FROM_OPEN_GROUPS';

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
export const defeatImperialFigure = (group: ImperialUnitType, addToOpen: boolean = true) => ({
  payload: {addToOpen, group},
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
  groupsToReinforce: Array<{alias: Object, groupNumber: number, id: string, name: string}>,
  newOpenGroups: ImperialUnitType[]
) => ({
  payload: {groupsToReinforce, newOpenGroups},
  type: SET_IMPERIAL_FIGURES_AFTER_DEPLOY_REINFORCE,
});
export const deployNewGroups = (
  groupIds: string[],
  missionThreat: number,
  difficulty: string,
  aliasColor: string,
  aliasNumber: number,
  imperialRewards: {[string]: boolean}
) => ({
  payload: {aliasColor, aliasNumber, difficulty, groupIds, imperialRewards, missionThreat},
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
export const setCustomUnitAI = (unit: string, commands: Object[]) =>
  createAction(SET_CUSTOM_UNIT_AI, {commands, unit});
export const clearCustomUnitAI = (unit: string) => createAction(CLEAR_CUSTOM_UNIT_AI, {unit});
export const setVillains = (villains: string[]) => createAction(SET_VILLAINS, {villains});
export const removeFromOpenGroups = (groupId: string) =>
  createAction(REMOVE_FROM_OPEN_GROUPS, {groupId});

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
export const getVillains = (state: StateType) => state.imperials.villains;

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

  yield call(helperDeployGroupInteractive, 'Optional Deployment', groupsToDeploy);
  yield put(setImperialFiguresAfterDeployReinforce([], newOpenGroups));

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
          alias: deployedGroups[i].alias,
          groupNumber: deployedGroups[i].groupNumber,
          id: deployedGroups[i].id,
          name: deployedGroups[i].name,
        });
        currentThreat -= threatNeededToReinforce;
        unitsMissing--;
      }
    }
  }

  yield call(helperDeployGroupInteractive, 'Reinforcement', groupsToDeploy);
  if (groupsToReinforce.length) {
    yield put(displayModal('STATUS_REINFORCEMENT', {groupsToReinforce}));
    yield call(waitForModal('STATUS_REINFORCEMENT'));
  }

  yield put(setImperialFiguresAfterDeployReinforce(groupsToReinforce, newOpenGroups));

  yield put(statusPhaseDeployReinforceDone(currentThreat));
}

function* handleImperialFigureDefeat(action: Object): Generator<*, *, *> {
  const {addToOpen, group: groupToDecrement} = action.payload;
  const {deployedGroups} = yield select(getCurrentGroups);

  let groupsToAddToOpen = [];

  const newDeployedGroups = decrementFigureFromGroup(
    groupToDecrement,
    deployedGroups,
    groupsToAddToOpen
  );

  // If after defeating we don't want to add this group to open groups, just set it an empty array
  // so we don't concat anything
  if (!addToOpen) {
    groupsToAddToOpen = [];
  }

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

// Handle special end round effects that deployed units may have
function* handleUnitEndRoundEffects(): Generator<*, *, *> {
  // Handle Probe Droids
  // TODO: Need to figure out how many probe droids are deployed, then for each one,
  // display a modal asking if they should self destruct. If so then need to use a confirm modal
  // and defeat the one. That means we need to put in the UI which probe droid we are going to
  // defeat.
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
    takeEvery(STATUS_PHASE_END_ROUND_EFFECTS, handleUnitEndRoundEffects),
  ]);
}
