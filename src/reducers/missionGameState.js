// @flow

export const PLAYER_HERO = 0;
export const PLAYER_IMPERIAL = 1;

export const PHASE_EVENT = 0;
export const PHASE_ACTIVATION = 1;
export const PHASE_STATUS = 2;

const initialState = {
  currentActivePlayer: PLAYER_HERO,
  currentPhase: PHASE_EVENT,
  currentRound: 0,
  currentThreat: 0,
  currentWoundedHeroes: [],
  initialGroups: [],
  mapStates: [],
  maxRounds: 0,
  name: '',
  openGroups: 0,
  reservedGroups: [],
  step: 0,
  threatIncreasePerRound: 2, // <-- this needs to be configurable up front
};

export default (state = initialState, action) => {
  return state;
};
