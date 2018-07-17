// @flow

import {
  addToRoster,
  enableEscape,
  SET_REBEL_ESCAPED,
  setRebelHpBoost,
  WOUND_REBEL_OTHER,
} from '../rebels';
import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {
  getCurrentRound,
  MISSION_SPECIAL_SETUP,
  missionSpecialSetupDone,
  SET_MAP_STATE_ACTIVATED,
  setAttackTarget,
  setDeploymentPoint,
  setMapStateActivated,
  setMapStateVisible,
  setMoveTarget,
  STATUS_PHASE_END_ROUND_EFFECTS,
  statusPhaseEndRoundEffectsDone,
  updateRebelVictory,
} from '../mission';
import {OPTIONAL_DEPLOYMENT_DONE, optionalDeployment} from '../imperials';
import createAction from '../createAction';
import {displayModal} from '../modal';
import {getMissionThreat} from '../app';
import handleStatusPhaseBegin from './sharedSagas/handleStatusPhaseBegin';
import helperDeploy from './helpers/helperDeploy';
import helperEventModal from './helpers/helperEventModal';
import helperIncreaseThreat from './helpers/helperIncreaseThreat';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import {missionSagaLoadDone} from '../app';
import {REFER_CAMPAIGN_GUIDE} from './constants';
import type {StateType} from '../types';
import track from '../../lib/track';

// Constants

const TARGET_LUKE = 'Luke (or closest hero)';
const TARGET_TERMINAL = 'the terminal';
const TARGET_GARAGE = 'the center of the Garage';

const DEPLOYMENT_POINT_GREEN_NW = 'The north west green deployment point';
const DEPLOYMENT_POINT_GREEN_E = 'The east green deployment point';

// Types

export type HomecomingStateType = {
  garageOpened: boolean,
};

// State

const initialState = {
  garageOpened: false,
};

export default (state: HomecomingStateType = initialState, action: Object) => {
  switch (action.type) {
    case 'HOMECOMING_GARAGE_OPENED':
      return {
        ...state,
        garageOpened: true,
      };
    default:
      return state;
  }
};

// Selectors

export const getHomecomingGoalText = (state: StateType): string[] => {
  if (!state.homecoming.garageOpened) {
    return [
      '{BOLD}Doors:{END}',
      'Doors are locked for all figures. {ELITE}Luke Skywalker{END} can interact with the terminal to open.',
    ];
  } else {
    return [
      '{BOLD}Escaping:{END}',
      'If the Garage has 2 or fewer Imperial figures, {ELITE}Luke{END} may escape by interacting with the ship.',
    ];
  }
};

// Sagas

function* handleTerminalInteract(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'terminal' && value === true) {
      yield put(setMapStateActivated(1, 'door', true));
      yield put(setMapStateActivated(2, 'door', true));
      yield put(setMapStateActivated(3, 'door', true));
      yield put(setMapStateVisible(1, 'terminal', false));
      yield call(handleGarageOpens);
    }
  }
}

function* handleGarageOpens(): Generator<*, *, *> {
  track('homecoming', 'darkLord', 'triggered');
  // Deploy vader and stormtrooper
  yield call(
    helperDeploy,
    'Dark Lord',
    REFER_CAMPAIGN_GUIDE,
    ['{ELITE}Darth Vader{END} and a Stormtrooper group will now be deployed.'],
    ['darthVader', 'Deploy to the red point.'],
    ['stormtrooper', 'Deploy to the Garage, adjacent to the ship (the T-16 Skyhopper).']
  );

  yield call(helperEventModal, {
    text: [
      'The adjacent blocked spaces represent the ship (the T-16 Skyhopper).',
      'If there are 2 or fewer Imperial figures in the Garage, Luke can interact with the ship by standing on one of the adjacent blocked spaces to escape.',
    ],
    title: 'Dark Lord',
  });

  yield put(createAction('HOMECOMING_GARAGE_OPENED', true));

  // Change goal
  yield put(updateRebelVictory('Luke escapes'));
  // Switch targets
  yield put(setMoveTarget(TARGET_GARAGE));
  // Enable escaping
  yield put(enableEscape());
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN_E));
}

function* handleLukeEscaped(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_REBEL_ESCAPED);
    const {id} = action.payload;
    if (id === 'luke') {
      // End game with rebel victory
      yield put(displayModal('REBEL_VICTORY'));
      track('homecoming', 'victory', 'escaped');
      break;
    }
  }
}

function* handleLukeDefeated(): Generator<*, *, *> {
  while (true) {
    const action = yield take(WOUND_REBEL_OTHER);
    const {id} = action.payload;
    if (id === 'luke') {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      track('homecoming', 'defeat', 'lukeKilled');
      break;
    }
  }
}

// REQUIRED SAGA
function* handleRoundEnd(): Generator<*, *, *> {
  while (true) {
    yield take(STATUS_PHASE_END_ROUND_EFFECTS);
    const currentRound = yield select(getCurrentRound);

    if (currentRound === 6) {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      track('homecoming', 'defeat', 'rounds');
      break;
    }

    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(helperInitialSetup, ['probeDroid', 'stormtrooper', 'trandoshanHunter']);
  yield call(helperEventModal, {
    text: [
      'The heroes control {ELITE}Luke Skywalker{END} as an ally at no additional cost.',
      'The threat has been increased by twice the threat level.',
      'An optional deployment will now be done.',
    ],
    title: 'Initial Setup',
  });
  // Double current threat
  yield call(helperIncreaseThreat, 2);
  // Do optional deployment
  yield put(optionalDeployment());
  yield take(OPTIONAL_DEPLOYMENT_DONE);

  // Deploy Luke
  yield put(addToRoster('luke'));
  // Add health
  const missionThreat = yield select(getMissionThreat);
  yield put(setRebelHpBoost('luke', missionThreat * 2));

  yield call(helperMissionBriefing, [
    'The door is locked to all figures. {ELITE}Luke Skywalker{END} can interact with the terminal to open them.',
    `{ELITE}Luke{END} gains ${missionThreat * 2} extra Health.`,
  ]);
  yield put(missionSpecialSetupDone());
}

/*
Priority target definitions:
1) Initial is luke, move is luke
*/

export function* homecoming(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_LUKE));
  yield put(setMoveTarget(TARGET_TERMINAL));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN_NW));

  yield all([
    fork(handleSpecialSetup),
    fork(handleTerminalInteract),
    fork(handleLukeEscaped),
    fork(handleLukeDefeated),
    fork(handleStatusPhaseBegin),
    fork(handleRoundEnd),
  ]);

  track('missionStart', 'homecoming');
  yield put(missionSagaLoadDone());
}
