// @flow

import {all, put, select, takeEvery} from 'redux-saga/effects';
import {LOAD_MISSION, STATUS_PHASE_READY_GROUPS} from './mission';
import random from 'lodash/random';
import {SET_REBEL_HERO_ACTIVATED} from './rebels';
import units from '../data/units';

// Types

export type ImperialUnitCommandType = {
  condition: string,
  command: string,
};

export type ImperialUnitType = {
  commands: ImperialUnitCommandType[],
  elite: boolean,
  groupNumber: number,
  id: string,
  maxInGroup: number,
  name: string,
  reinforcementCost: number,
  threat: number,
};

// State

const initialState = {
  activatedGroups: [],
  exhaustedGroups: [],
  openGroups: 0,
  readyGroups: [],
  reservedGroups: [],
};

let globalGroupCounter = 0;

export default (state: Object = initialState, action: Object) => {
  switch (action.type) {
    case LOAD_MISSION:
      const {config} = action.payload;
      return {
        ...state,
        openGroups: 0,
        readyGroups: config.initialGroups.map((id: string) => ({
          ...units[id],
          groupNumber: globalGroupCounter++,
        })),
        reservedGroups: config.reservedGroups.map((id: string) => units[id]),
      };
    case ACTIVATE_IMPERIAL_GROUP: {
      const {group} = action.payload;
      return {
        ...state,
        activatedGroups: state.activatedGroups.concat([group]),
        readyGroups: state.readyGroups.filter((readyGroup: ImperialUnitType) => readyGroup.groupNumber !== group.groupNumber),
      };
    }
    case SET_IMPERIAL_GROUP_ACTIVATED: {
      const {group} = action.payload;
      return {
        ...state,
        activatedGroups: [],
        exhaustedGroups: state.exhaustedGroups.concat([group]),
      };
    }
    case STATUS_PHASE_READY_GROUPS:
      return {
        ...state,
        activatedGroups: [],
        exhaustedGroups: [],
        readyGroups: state.exhaustedGroups.slice(),
      };
    default:
      return state;
  }
};

// Action types

export const SET_IMPERIAL_GROUP_ACTIVATED = 'SET_IMPERIAL_GROUP_ACTIVATED';
export const ACTIVATE_IMPERIAL_GROUP = 'ACTIVATE_IMPERIAL_GROUP';

// Action creators

export const setImperialGroupActivated = (group: ImperialUnitType) => ({
  payload: {group},
  type: SET_IMPERIAL_GROUP_ACTIVATED,
});
export const activateImperialGroup = (group: ImperialUnitType) => ({
  payload: {group},
  type: ACTIVATE_IMPERIAL_GROUP,
});

// Selectors

export const getReadyImperialGroups = (state: Object) => state.imperials.readyGroups;

// Sagas

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
  yield all([takeEvery(SET_REBEL_HERO_ACTIVATED, handleImperialActivation)]);
}
