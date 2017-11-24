// @flow

import type {StateType} from './types';
import {STATUS_PHASE_READY_GROUPS} from './mission';

// Types

export type RebelsStateType = {
  activatedRebels: string[],
  canActivateTwice: string[],
  roster: string[],
  withdrawnHeroes: string[],
  woundedHeroes: string[],
};

// State

const initialState = {
  activatedRebels: [],
  canActivateTwice: [],
  roster: [],
  withdrawnHeroes: [],
  woundedHeroes: [],
};

export default (state: RebelsStateType = initialState, action: Object) => {
  switch (action.type) {
    case SET_ROSTER:
      const {roster} = action.payload;
      return {
        ...initialState,
        canActivateTwice: roster.length === 2 ? roster.slice() : state.canActivateTwice,
        roster: roster.sort(),
      };
    case SET_REBEL_HERO_ACTIVATED: {
      const {id} = action.payload;
      return {
        ...state,
        activatedRebels: state.activatedRebels.concat([id]),
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
      const {id} = action.payload;
      if (state.woundedHeroes.includes(id)) {
        return {
          ...state,
          canActivateTwice: state.canActivateTwice.filter((heroId: string) => heroId !== id),
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

export const SET_ROSTER = 'SET_ROSTER';
export const SET_REBEL_HERO_ACTIVATED = 'SET_REBEL_HERO_ACTIVATED';
export const SET_HERO_ACTIVATE_TWICE = 'SET_HERO_ACTIVATE_TWICE';
export const WOUND_REBEL_HERO = 'WOUND_REBEL_HERO';

// Action creators

export const setRoster = (roster: string[]) => ({
  payload: {roster},
  type: SET_ROSTER,
});
export const setRebelHeroActivated = (id: string) => ({
  payload: {id},
  type: SET_REBEL_HERO_ACTIVATED,
});
export const setHeroActivateTwice = (id: string) => ({
  payload: {id},
  type: SET_HERO_ACTIVATE_TWICE,
});
export const woundRebelHero = (id: string) => ({
  payload: {id},
  type: WOUND_REBEL_HERO,
});

// Selectors

export const getRoster = (state: StateType) => state.rebels.roster;
export const getIsThereReadyRebelFigures = (state: StateType) =>
  state.rebels.activatedRebels.length !==
  state.rebels.roster.length +
    state.rebels.canActivateTwice.length -
    state.rebels.withdrawnHeroes.length;
export const getAreAllHeroesWounded = (state: StateType) =>
  state.rebels.woundedHeroes.length + state.rebels.withdrawnHeroes.length ===
  state.rebels.roster.length;
export const getIsOneHeroLeft = (state: StateType) =>
  state.rebels.roster.length -
    state.rebels.woundedHeroes.length -
    state.rebels.withdrawnHeroes.length ===
  1;
