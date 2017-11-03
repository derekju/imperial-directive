// @flow

import uniq from 'lodash/uniq';

// Types

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
  roster: ['diala', 'fenn', 'gaarkhan', 'gideon', 'han'],
};

export default (state: Object = initialState, action: Object) => {
  switch (action.type) {
    case SET_REBEL_HERO_ACTIVATED:
      const {id} = action.payload;
      return {
        ...state,
        activatedRebels: uniq(state.activatedRebels.concat([id])),
      };
    default:
      return state;
  }
};

// Action types

export const SET_REBEL_HERO_ACTIVATED = 'SET_REBEL_HERO_ACTIVATED';

// Action creators

export const setRebelHeroActivated = (id: string) => ({
  payload: {id},
  type: 'SET_REBEL_HERO_ACTIVATED',
});
