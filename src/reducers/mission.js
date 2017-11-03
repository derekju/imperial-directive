// @flow

import {all, put, select, takeEvery} from 'redux-saga/effects';
import {SET_REBEL_HERO_ACTIVATED} from './rebels';

// Types

export type MissionConfigType = {
  initialGroups: string[],
  mapStates: string[],
  maxRounds: number,
  name: string,
  openGroups: number,
  reservedGroups: string[],
};

// Constants

export const PLAYER_HERO = 0;
export const PLAYER_IMPERIAL = 1;

export const PHASE_EVENT = 0;
export const PHASE_ACTIVATION = 1;
export const PHASE_STATUS = 2;

// State

const initialState = {
  currentActivePlayer: PLAYER_HERO,
  currentPhase: PHASE_EVENT,
  currentRound: 0,
  currentThreat: 0,
  maxRounds: 0,
  threatIncreasePerRound: 0,
};

export default (state: Object = initialState, action: Object) => {
  switch (action.type) {
    case LOAD_MISSION:
      const {config, threatIncreasePerRound} = action.payload;
      return {
        ...state,
        maxRounds: config.maxRounds,
        threatIncreasePerRound,
      };
    case SET_REBEL_HERO_ACTIVATED:
      return {
        ...state,
        currentActivePlayer: PLAYER_IMPERIAL,
      };
    case MISSION_START:
      return {
        ...state,
        currentActivePlayer: PLAYER_HERO,
        currentRound: 1,
        currentThreat: 0,
      };
    // case MISSION_TURN_END:
    //   return {
    //     ...state,
    //     currentActivePlayer:
    //       state.currentActivePlayer === PLAYER_HERO ? PLAYER_IMPERIAL : PLAYER_HERO,
    //     currentRound: state.currentRound + 1,
    //     currentThreat: state.currentThreat + state.threatIncreasePerRound,
    //   };
    default:
      return state;
  }
};

// Action types

export const LOAD_MISSION = 'LOAD_MISSION';
export const MISSION_START = 'MISSION_START';

// Action creators

export const loadMission = (config: MissionConfigType, threatIncreasePerRound: number) => ({
  payload: {config, threatIncreasePerRound},
  type: 'LOAD_MISSION',
});
export const missionStart = () => ({type: 'MISSION_START'});

// Selectors

export const isRebelPlayerTurn = (state: Object) => state.mission.currentActivePlayer === PLAYER_HERO;

// Sagas

function* handleLoadMission(action: Object): Generator<*, *, *> {
  // const {config} = action.payload;
  yield put(missionStart());
}

export function* missionSaga(): Generator<*, *, *> {
  yield all([takeEvery(LOAD_MISSION, handleLoadMission)]);
}
