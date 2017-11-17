// @flow

import {all, call, put, select, takeEvery} from 'redux-saga/effects';
import {
  getCurrentThreat,
  LOAD_MISSION,
  STATUS_PHASE_DEPLOY_REINFORCE,
  STATUS_PHASE_READY_GROUPS,
} from './mission';
import decrementFigureFromGroup from './utils/decrementFigureFromGroup';
import {displayModal} from './modal';
import filter from 'lodash/filter';
import find from 'lodash/find';
import populateOpenGroups from './utils/populateOpenGroups';
import random from 'lodash/random';
import {SET_REBEL_HERO_ACTIVATED} from './rebels';
import sortBy from 'lodash/sortBy';
import type {StateType} from './types';
import units from '../data/units';
import waitForModal from '../sagas/waitForModal';

// Types

export type ImperialUnitCommandType = {
  condition: string,
  command: string,
};

export type ImperialUnitType = {
  buffs: string[],
  commands: ImperialUnitCommandType[],
  currentNumFigures: number,
  elite: boolean,
  exhausted: boolean,
  groupNumber: number,
  id: string,
  maxInGroup: number,
  name: string,
  reinforcementCost: number,
  threat: number,
};

export type ImperialsStateType = {
  activatedGroup: ?ImperialUnitType,
  deployedGroups: ImperialUnitType[],
  openGroups: ImperialUnitType[],
};

// Utils

const createNewGroup = (id: string): ImperialUnitType => ({
  ...units[id],
  currentNumFigures: units[id].maxInGroup,
  exhausted: false,
  groupNumber: globalGroupCounter++,
});

// State

const initialState = {
  activatedGroup: null,
  deployedGroups: [],
  openGroups: [],
};

let globalGroupCounter = 0;

export default (state: ImperialsStateType = initialState, action: Object) => {
  switch (action.type) {
    case LOAD_MISSION:
      const {config} = action.payload;
      return {
        ...state,
        deployedGroups: config.initialGroups.map(createNewGroup),
        openGroups: populateOpenGroups(config.openGroups),
      };
    case ACTIVATE_IMPERIAL_GROUP: {
      const {group} = action.payload;
      return {
        ...state,
        activatedGroup: group,
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
    case SET_IMPERIAL_FIGURES_AFTER_DEFEAT: {
      const {deployedGroups, openGroups} = action.payload;
      return {
        ...state,
        deployedGroups,
        openGroups: state.openGroups.concat(openGroups),
      };
    }
    case SET_IMPERIAL_FIGURES_AFTER_DEPLOY_REINFORCE: {
      const {groupsToDeploy, groupsToReinforce, newOpenGroups} = action.payload;
      return {
        ...state,
        deployedGroups: state.deployedGroups
          .map((deployedGroup: ImperialUnitType) => {
            if (
              find(groupsToReinforce, {
                groupNumber: deployedGroup.groupNumber,
                id: deployedGroup.id,
              })
            ) {
              deployedGroup.currentNumFigures++;
            }
            return deployedGroup;
          })
          .concat(groupsToDeploy.map(createNewGroup)),
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
    case DEPLOY_NEW_GROUPS:
      const {groupIds} = action.payload;
      return {
        ...state,
        deployedGroups: state.deployedGroups.concat(groupIds.map(createNewGroup)),
      };
    default:
      return state;
  }
};

// Action types

export const SET_IMPERIAL_GROUP_ACTIVATED = 'SET_IMPERIAL_GROUP_ACTIVATED';
export const ACTIVATE_IMPERIAL_GROUP = 'ACTIVATE_IMPERIAL_GROUP';
export const TRIGGER_IMPERIAL_ACTIVATION = 'TRIGGER_IMPERIAL_ACTIVATION';
export const DEFEAT_IMPERIAL_FIGURE = 'DEFEAT_IMPERIAL_FIGURE';
export const SET_IMPERIAL_FIGURES_AFTER_DEFEAT = 'SET_IMPERIAL_FIGURES_AFTER_DEFEAT';
export const SET_IMPERIAL_FIGURES_AFTER_DEPLOY_REINFORCE =
  'SET_IMPERIAL_FIGURES_AFTER_DEPLOY_REINFORCE';
export const DEPLOY_NEW_GROUPS = 'DEPLOY_NEW_GROUPS';

// Action creators

export const setImperialGroupActivated = (group: ImperialUnitType) => ({
  payload: {group},
  type: SET_IMPERIAL_GROUP_ACTIVATED,
});
export const activateImperialGroup = (group: ImperialUnitType) => ({
  payload: {group},
  type: ACTIVATE_IMPERIAL_GROUP,
});
export const triggerImperialActivation = () => ({type: TRIGGER_IMPERIAL_ACTIVATION});
export const defeatImperialFigure = (group: ImperialUnitType) => ({
  payload: {group},
  type: DEFEAT_IMPERIAL_FIGURE,
});
export const setImperialFiguresAfterDefeat = (
  deployedGroups: ImperialUnitType[],
  openGroups: ImperialUnitType[]
) => ({
  payload: {deployedGroups, openGroups},
  type: SET_IMPERIAL_FIGURES_AFTER_DEFEAT,
});
export const setImperialFiguresAfterDeployReinforce = (
  groupsToDeploy: Array<{id: string}>,
  groupsToReinforce: Array<{groupNumber: number, id: string}>,
  newOpenGroups: ImperialUnitType[]
) => ({
  payload: {groupsToDeploy, groupsToReinforce, newOpenGroups},
  type: SET_IMPERIAL_FIGURES_AFTER_DEPLOY_REINFORCE,
});
export const deployNewGroups = (groupIds: string[]) => ({
  payload: {groupIds},
  type: DEPLOY_NEW_GROUPS,
});

// Selectors

export const getReadyImperialGroups = (state: StateType) =>
  filter(state.imperials.deployedGroups, {exhausted: false});
export const getExhaustedImperialGroups = (state: StateType) =>
  filter(state.imperials.deployedGroups, {exhausted: true});
export const getCurrentGroups = (state: StateType) => ({
  deployedGroups: state.imperials.deployedGroups,
  openGroups: state.imperials.openGroups,
});

// Sagas

function* handleDeployAndReinforcement(): Generator<*, *, *> {
  let currentThreat = yield select(getCurrentThreat);
  const {deployedGroups, openGroups} = yield select(getCurrentGroups);

  const newOpenGroups = [];
  const groupsToDeploy = [];
  const groupsToReinforce = [];

  // Ok, we have all the information we need so figure out how we are going to do this
  // We should spend our threat on the highest cost deployments and use the rest of the threat
  // to reinforce
  if (openGroups.length) {
    // Sort the open groups array by highest to lowest threat
    // Iterate and pull groups off until we cannot do so anymore
    const sortedOpenGroups = sortBy(openGroups, (unit: ImperialUnitType) => unit.threat);

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

  yield put(
    setImperialFiguresAfterDeployReinforce(groupsToDeploy, groupsToReinforce, newOpenGroups)
  );

  yield put(
    displayModal('STATUS_REINFORCEMENT', {currentThreat, groupsToDeploy, groupsToReinforce})
  );
  yield call(waitForModal('STATUS_REINFORCEMENT'));
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

  yield put(setImperialFiguresAfterDefeat(newDeployedGroups, groupsToAddToOpen));
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
    takeEvery([SET_REBEL_HERO_ACTIVATED, TRIGGER_IMPERIAL_ACTIVATION], handleImperialActivation),
    takeEvery(DEFEAT_IMPERIAL_FIGURE, handleImperialFigureDefeat),
    takeEvery(STATUS_PHASE_DEPLOY_REINFORCE, handleDeployAndReinforcement),
  ]);
}
