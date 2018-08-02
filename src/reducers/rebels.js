// @flow

import createAction from './createAction';
import rebels from '../data/rebels.json';
import type {StateType} from './types';
import {STATUS_PHASE_READY_GROUPS} from './mission';
import without from 'lodash/without';

// Types

export type RebelConfigType = {
  id: string,
  firstName: string,
  lastName: string,
  elite: boolean,
  threat: number,
  reinforcementCost: number,
  maxInGroup: number,
  type: 'hero' | 'ally' | 'mission',
};

export type RebelUnitType = {
  currentNumFigures: number,
  elite: boolean,
  firstName: string,
  hpBoost: number,
  id: string,
  maxInGroup: number,
  type: 'hero' | 'ally' | 'mission',
};

export type RebelsStateType = {
  activatedRebels: string[],
  allyChosen: ?string,
  canActivateTwice: string[],
  canIncapacitate: string[],
  enableEscape: boolean,
  escapedRebels: string[],
  fakeWithdrawnHeroes: string[],
  roster: RebelUnitType[],
  withdrawnHeroes: string[],
  woundedHeroes: string[],
  woundedOther: string[],
};

// Utils

const createRebelUnit = (id: string, numHeroes: number) => {
  const unit = rebels[id];
  const isHero = unit.type === 'hero';

  return {
    currentNumFigures: unit.maxInGroup,
    elite: unit.elite,
    firstName: unit.firstName,
    hpBoost: isHero ? (numHeroes === 2 ? 10 : numHeroes === 3 ? 3 : 0) : 0,
    id,
    maxInGroup: unit.maxInGroup,
    type: unit.type,
  };
};

// State

const initialState = {
  activatedRebels: [],
  allyChosen: null,
  canActivateTwice: [],
  canIncapacitate: [],
  enableEscape: false,
  escapedRebels: [],
  fakeWithdrawnHeroes: [],
  roster: [],
  withdrawnHeroes: [],
  woundedHeroes: [],
  woundedOther: [],
};

export default (state: RebelsStateType = initialState, action: Object) => {
  switch (action.type) {
    case SET_ROSTER:
      const {roster} = action.payload;
      const heroes = roster.filter((id: string) => rebels[id].type === 'hero');

      return {
        ...initialState,
        canActivateTwice: heroes.length === 2 ? heroes.slice() : state.canActivateTwice,
        roster: roster.map((id: string) => createRebelUnit(id, heroes.length)),
      };
    case SILENT_SET_REBEL_ACTIVATED:
    case SET_REBEL_ACTIVATED: {
      const {id} = action.payload;
      return {
        ...state,
        activatedRebels: (state.activatedRebels.concat([id]): string[]),
      };
    }
    case SET_HERO_ACTIVATE_TWICE: {
      const {id} = action.payload;
      return {
        ...state,
        canActivateTwice: [id],
      };
    }
    case STATUS_PHASE_READY_GROUPS:
      return {
        ...state,
        activatedRebels: [],
      };
    case WOUND_REBEL_HERO: {
      const {id, withdrawnHeroCanActivate} = action.payload;
      if (state.woundedHeroes.includes(id)) {
        // If the hero can still activate, we do want to flag them as withdrawn but not REALLY withdrawn
        // The system assumes withdrawn is removed completely so add to a fakeWithdrawn state so we can separate the two
        // Since they can still activate we need to preserve their canActivateTwice status
        if (withdrawnHeroCanActivate) {
          return {
            ...state,
            fakeWithdrawnHeroes: (state.fakeWithdrawnHeroes.concat([id]): string[]),
            woundedHeroes: without(state.woundedHeroes, id),
          };
        }

        return {
          ...state,
          activatedRebels: without(state.activatedRebels, id),
          canActivateTwice: without(state.canActivateTwice, id),
          withdrawnHeroes: (state.withdrawnHeroes.concat([id]): string[]),
          woundedHeroes: without(state.woundedHeroes, id),
        };
      } else {
        return {
          ...state,
          woundedHeroes: (state.woundedHeroes.concat([id]): string[]),
        };
      }
    }
    case SET_REBEL_ESCAPED: {
      const {id} = action.payload;
      return {
        ...state,
        activatedRebels: without(state.canActivateTwice, id),
        canActivateTwice: without(state.canActivateTwice, id),
        escapedRebels: (state.escapedRebels.concat([id]): string[]),
        roster: without(state.roster, id),
        woundedHeroes: without(state.woundedHeroes, id),
      };
    }
    case ADD_TO_ROSTER: {
      return {
        ...state,
        roster: (state.roster.concat([createRebelUnit(action.payload.id, 0)]): RebelUnitType[]),
      };
    }
    case ADD_SINGLE_UNIT_TO_ROSTER: {
      const {id} = action.payload;

      // If the unit is already present, add 1 to it's currentNumFigures as long as it does not exceed
      // the max. Otherwise, add it and set it's numFigures to 1
      let unitFound = false;
      const newRoster = (state.roster.map((unit: RebelUnitType) => {
        if (unit.id === id) {
          unitFound = true;
          if (unit.currentNumFigures < unit.maxInGroup) {
            return {...unit, currentNumFigures: unit.currentNumFigures + 1};
          }
        }
        return unit;
      }): RebelUnitType[]);

      if (!unitFound) {
        const newUnit = createRebelUnit(id, 0);
        newUnit.currentNumFigures = 1;
        newRoster.push(newUnit);
      }

      return {
        ...state,
        roster: newRoster,
        // If unit was not found, we are creating a new one of it so make sure it doesn't exist in
        // woundedOther anymore in case it was there
        woundedOther: !unitFound ? without(state.woundedOther, id) : state.woundedOther,
      };
    }
    case WOUND_REBEL_OTHER: {
      const {id} = action.payload;
      let needToAddToWoundedOther = false;
      const newRoster = (state.roster
        .map((unit: RebelUnitType) => {
          if (unit.id !== id) {
            return unit;
          } else {
            if (unit.currentNumFigures - 1 > 0) {
              return {
                ...unit,
                currentNumFigures: unit.currentNumFigures - 1,
              };
            } else {
              needToAddToWoundedOther = true;
              // $FlowFixMe - We're going to manually filter this out
              return false;
            }
          }
        })
        .filter(Boolean): RebelUnitType[]);

      return {
        ...state,
        roster: newRoster,
        woundedOther: needToAddToWoundedOther
          ? (state.woundedOther.concat([id]): string[])
          : state.woundedOther,
      };
    }
    case SET_REBEL_HP_BOOST: {
      const {id, boost} = action.payload;
      return {
        ...state,
        roster: (state.roster.map((unit: RebelUnitType) => {
          if (unit.id !== id) {
            return unit;
          } else {
            return {
              ...unit,
              hpBoost: boost,
            };
          }
        }): RebelUnitType[]),
      };
    }
    case SET_ALLY_CHOSEN: {
      const {id} = action.payload;
      return {
        ...state,
        allyChosen: id,
      };
    }
    case ENABLE_ESCAPE: {
      return {
        ...state,
        enableEscape: true,
      };
    }
    case SET_CAN_INCAPACITATE: {
      return {
        ...state,
        canIncapacitate: action.payload.groupIds,
      };
    }
    default:
      return state;
  }
};

// Action types

export const SET_ROSTER = 'SET_ROSTER';
export const SET_REBEL_ACTIVATED = 'SET_REBEL_ACTIVATED';
export const SILENT_SET_REBEL_ACTIVATED = 'SILENT_SET_REBEL_ACTIVATED';
export const SET_HERO_ACTIVATE_TWICE = 'SET_HERO_ACTIVATE_TWICE';
export const WOUND_REBEL_HERO = 'WOUND_REBEL_HERO';
export const SET_REBEL_ESCAPED = 'SET_REBEL_ESCAPED';
export const ADD_TO_ROSTER = 'ADD_TO_ROSTER';
export const ADD_SINGLE_UNIT_TO_ROSTER = 'ADD_SINGLE_UNIT_TO_ROSTER';
export const WOUND_REBEL_OTHER = 'WOUND_REBEL_OTHER';
export const SET_REBEL_HP_BOOST = 'SET_REBEL_HP_BOOST';
export const SET_ALLY_CHOSEN = 'SET_ALLY_CHOSEN';
export const ENABLE_ESCAPE = 'ENABLE_ESCAPE';
export const SET_CAN_INCAPACITATE = 'SET_CAN_INCAPACITATE';

// Action creators

export const setRoster = (roster: string[]) => createAction(SET_ROSTER, {roster});
export const setRebelActivated = (id: string) => createAction(SET_REBEL_ACTIVATED, {id});
export const silentSetRebelActivated = (id: string) =>
  createAction(SILENT_SET_REBEL_ACTIVATED, {id});
export const setHeroActivateTwice = (id: string) => createAction(SET_HERO_ACTIVATE_TWICE, {id});
export const woundRebelHero = (id: string, withdrawnHeroCanActivate: boolean) =>
  createAction(WOUND_REBEL_HERO, {id, withdrawnHeroCanActivate});
export const setRebelEscaped = (id: string) => createAction(SET_REBEL_ESCAPED, {id});
export const addToRoster = (id: string) => createAction(ADD_TO_ROSTER, {id});
export const addSingleUnitToRoster = (id: string) => createAction(ADD_SINGLE_UNIT_TO_ROSTER, {id});
export const woundRebelOther = (id: string) => createAction(WOUND_REBEL_OTHER, {id});
export const setRebelHpBoost = (id: string, boost: number) =>
  createAction(SET_REBEL_HP_BOOST, {boost, id});
export const setAllyChosen = (id: string) => createAction(SET_ALLY_CHOSEN, {id});
export const enableEscape = () => createAction(ENABLE_ESCAPE);
export const setCanIncapacitate = (groupIds: string[]) =>
  createAction(SET_CAN_INCAPACITATE, {groupIds});

// Selectors

export const getRoster = (state: StateType) => state.rebels.roster;
export const getRosterOfType = (state: StateType, type: string): RebelUnitType[] =>
  state.rebels.roster.filter((unit: RebelUnitType) => unit.type === type);
export const getWithdrawnHeroes = (state: StateType): string[] => state.rebels.withdrawnHeroes;
export const getIsThereReadyRebelFigures = (state: StateType) =>
  state.rebels.activatedRebels.length !==
  state.rebels.roster.length +
    state.rebels.canActivateTwice.length -
    state.rebels.withdrawnHeroes.length;
export const getAreAllHeroesWounded = (state: StateType) =>
  state.rebels.woundedHeroes.length +
    state.rebels.withdrawnHeroes.length +
    state.rebels.fakeWithdrawnHeroes.length ===
  getRosterOfType(state, 'hero').length;
export const getIsOneHeroLeft = (state: StateType) =>
  getRosterOfType(state, 'hero').length -
    state.rebels.woundedHeroes.length -
    state.rebels.withdrawnHeroes.length -
    state.rebels.fakeWithdrawnHeroes.length ===
  1;
export const getAreAllHeroesWithdrawn = (state: StateType) =>
  state.rebels.withdrawnHeroes.length + state.rebels.fakeWithdrawnHeroes.length ===
  getRosterOfType(state, 'hero').length;
export const getIsHeroWithdrawn = (state: StateType, heroId: string) =>
  state.rebels.withdrawnHeroes.includes(heroId) ||
  state.rebels.fakeWithdrawnHeroes.includes(heroId);
export const getCanHeroActivateTwice = (state: StateType, heroId: string) =>
  state.rebels.canActivateTwice.includes(heroId);
export const getWoundedOther = (state: StateType) => state.rebels.woundedOther;
export const getEscapedRebels = (state: StateType) => state.rebels.escapedRebels;
export const getAllyChosen = (state: StateType) => state.rebels.allyChosen;
