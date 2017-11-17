// @flow

import type {StateType} from './types';
import {STATUS_PHASE_READY_GROUPS} from './mission';
import uniq from 'lodash/uniq';

// Types

export type RebelsStateType = {
  activatedRebels: string[],
  roster: string[],
  withdrawnHeroes: string[],
  woundedHeroes: string[],
};

export type RebelUnitType = {
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
  activatedRebels: [],
  roster: ['diala', 'fenn', 'gaarkhan'],
  withdrawnHeroes: [],
  woundedHeroes: [],
};

export default (state: RebelsStateType = initialState, action: Object) => {
  switch (action.type) {
    case SET_REBEL_HERO_ACTIVATED:
      const {id} = action.payload;
      return {
        ...state,
        activatedRebels: uniq(state.activatedRebels.concat([id])),
      };
    case STATUS_PHASE_READY_GROUPS:
      return {
        ...state,
        activatedRebels: [],
      };
    case WOUND_REBEL_HERO: {
      const {id} = action.payload;
      if (state.woundedHeroes.includes(id)) {
        return {
          ...state,
          withdrawnHeroes: state.withdrawnHeroes.concat([id]),
          woundedHeroes: state.woundedHeroes.filter((heroId: string) => heroId !== id),
        };
      } else {
        return {
          ...state,
          woundedHeroes: state.woundedHeroes.concat([id]),
        };
      }
    }
    default:
      return state;
  }
};

// Action types

export const SET_REBEL_HERO_ACTIVATED = 'SET_REBEL_HERO_ACTIVATED';
export const WOUND_REBEL_HERO = 'WOUND_REBEL_HERO';

// Action creators

export const setRebelHeroActivated = (id: string) => ({
  payload: {id},
  type: 'SET_REBEL_HERO_ACTIVATED',
});
export const woundRebelHero = (id: string) => ({
  payload: {id},
  type: 'WOUND_REBEL_HERO',
});

// Selectors

export const getIsThereReadyRebelFigures = (state: StateType) =>
  state.rebels.activatedRebels.length !== state.rebels.roster.length - state.rebels.withdrawnHeroes.length;
export const getAreAllHeroesWounded = (state: StateType) =>
  state.rebels.woundedHeroes.length + state.rebels.withdrawnHeroes.length ===
  state.rebels.roster.length;
