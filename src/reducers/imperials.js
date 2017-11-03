// @flow

import {LOAD_MISSION} from './mission';
import units from '../data/units';

// Types

export type ImperialUnitCommandType = {
  condition: string,
  command: string,
};

export type ImperialUnitType = {
  commands: ImperialUnitCommandType[],
  elite: boolean,
  firstName: string,
  id: string,
  lastName: string,
  maxInGroup: number,
  reinforcementCost: number,
  threat: number,
};

// State

const initialState = {
  deployedGroups: [],
  exhaustedGroups: [],
  openGroups: 0,
  readyGroups: [],
  reservedGroups: [],
};

export default (state: Object = initialState, action: Object) => {
  switch (action.type) {
    case LOAD_MISSION:
      const {config} = action.payload;
      return {
        ...state,
        deployedGroups: config.initialGroups.map((groupId: string) => units[groupId]),
        openGroups: 0,
        readyGroups: config.initialGroups.map((groupId: string) => units[groupId]),
        reservedGroups: config.reservedGroups.map((groupId: string) => units[groupId]),
      };
    case SET_IMPERIAL_DEPLOYED_GROUPS:
      const {groups} = action.payload;
      return {
        ...state,
        deployedGroups: groups.slice(),
      };
    default:
      return state;
  }
};

// Action types

export const SET_IMPERIAL_DEPLOYED_GROUPS = 'SET_IMPERIAL_DEPLOYED_GROUPS';

// Action creators

export const setImperialDeployedGroups = (groups: string[]) => ({
  payload: {groups},
  type: 'SET_IMPERIAL_DEPLOYED_GROUPS',
});
