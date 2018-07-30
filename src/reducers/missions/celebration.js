// @flow

import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {
  getCurrentRound,
  MISSION_SPECIAL_SETUP,
  missionSpecialSetupDone,
  SET_MAP_STATE_ACTIVATED,
  setAttackTarget,
  setDeploymentPoint,
  setMoveTarget,
  STATUS_PHASE_END_ROUND_EFFECTS,
  statusPhaseEndRoundEffectsDone,
} from '../mission';
import {NO_INTERACTION_EXCLUSION_LIST, TARGET_CLOSEST_REBEL} from './constants';
import {OPTIONAL_DEPLOYMENT_DONE, optionalDeployment, setCustomAI} from '../imperials';
import {addToRoster} from '../rebels';
import createAction from '../createAction';
import {displayModal} from '../modal';
import getRandomItem from '../utils/getRandomItem';
import handleHeroesWounded from './sharedSagas/handleHeroesWounded';
import handleStatusPhaseBegin from './sharedSagas/handleStatusPhaseBegin';
import helperEventModal from './helpers/helperEventModal';
import helperIncreaseThreat from './helpers/helperIncreaseThreat';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import missions from '../../data/missions';
import {missionSagaLoadDone} from '../app';
import snakeCase from 'lodash/snakeCase';
import type {StateType} from '../types';
import track from '../../lib/track';

// Constants

const MISSION_NAME = 'celebration';
const MISSION_NAME_S = snakeCase(MISSION_NAME).toUpperCase();

const TARGET_FREED_WOOKIE = 'the closest unbound Wookiee';

const DEPLOYMENT_POINT_GREEN_E = 'The east green deployment point';
const DEPLOYMENT_POINT_GREEN_W = 'The west green deployment point';
const DEPLOYMENT_POINT_RED = 'The red deployment point';

const CUSTOM_AI_WOOKIEE = [
  {
    command:
      '{ACTION} Move to be adjacent to the unbound Wookiee and {ACTION} Interact with the unbound Wookiee to bind it.',
    condition:
      'If within distance to unbound Wookiee',
  },
];

// Types

export type CelebrationStateType = {
  assaultWaveTriggered: boolean,
  boundWookiees: number,
  priorityTargetKillHero: boolean,
};

// State

const initialState = {
  assaultWaveTriggered: false,
  boundWookiees: 0,
  priorityTargetKillHero: false,
};

export default (state: CelebrationStateType = initialState, action: Object) => {
  switch (action.type) {
    case `${MISSION_NAME_S}_PRIORITY_TARGET_KILL_HERO`:
      return {
        ...state,
        priorityTargetKillHero: action.payload,
      };
    case 'CELEBRATION_ASSAULT_WAVE_TRIGGERED':
      return {
        ...state,
        assaultWaveTriggered: true,
      };
    case 'CELEBRATION_WOOKIEE_BOUND':
      return {
        ...state,
        boundWookiees: Math.min(state.boundWookiees + 1, 8),
      };
    case 'CELEBRATION_WOOKIEE_FREED':
      return {
        ...state,
        boundWookiees: Math.max(0, state.boundWookiees - 1),
      };
    default:
      return state;
  }
};

// Selectors

const getState = (state: StateType) => state[MISSION_NAME];
export const getCelebrationGoalText = (state: StateType): string[] => {
  let goals = [];

  const {boundWookiees} = state.celebration;

  goals = goals.concat([
    '{BOLD}Bound Wookies:{END}',
    `Current Number of Bound Wookies: ${boundWookiees}`,
    '{BREAK}',
    'Rebel mission tokens represent freed Wookiees.',
    '{BREAK}',
    'Imperial mission tokens represent bound Wookies.',
    '{BREAK}',
    'An Imperial figure can interact with a Wookiee to bind it. Flip the token to the Imperial side.',
    '{BREAK}',
    'A healthy hero or {ELITE}Chewbacca{END} can interact ({STRENGTH} or {TECH}) with a bound Wookiee to free it. Flip the token to the Rebel side.',
  ]);

  return goals;
};

// Sagas

function* setRandomDeploymentPoint(): Generator<*, *, *> {
  const {assaultWaveTriggered} = yield select(getState);

  if (assaultWaveTriggered) {
    yield put(
      setDeploymentPoint(
        getRandomItem(DEPLOYMENT_POINT_GREEN_W, DEPLOYMENT_POINT_GREEN_E, DEPLOYMENT_POINT_RED)
      )
    );
  } else {
    yield put(
      setDeploymentPoint(getRandomItem(DEPLOYMENT_POINT_GREEN_W, DEPLOYMENT_POINT_GREEN_E))
    );
  }
}

function* handleAssaultWave(): Generator<*, *, *> {
  track(MISSION_NAME, 'assaultWave', 'triggered');
  yield call(helperEventModal, {
    text: ['The threat has been increased.'],
    title: 'Assault Wave',
  });

  yield call(helperIncreaseThreat, 1);
  yield put(createAction('CELEBRATION_ASSAULT_WAVE_TRIGGERED'));
}

function* handleWookieeBound(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {type, value} = action.payload;
    if (type === 'rebel') {
      if (value === true) {
        yield put(createAction('CELEBRATION_WOOKIEE_BOUND'));
      } else {
        yield put(createAction('CELEBRATION_WOOKIEE_FREED'));
      }
    }
  }
}

function* handleAllWookieesBound(): Generator<*, *, *> {
  while (true) {
    yield take('CELEBRATION_WOOKIEE_BOUND');
    const {boundWookiees} = yield select(getState);
    if (boundWookiees === 6) {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      track(MISSION_NAME, 'defeat', 'boundWookiees');
      break;
    }
  }
}

// REQUIRED SAGA
function* handleRoundEnd(): Generator<*, *, *> {
  while (true) {
    yield take(STATUS_PHASE_END_ROUND_EFFECTS);
    const currentRound = yield select(getCurrentRound);

    if (currentRound === 2) {
      yield call(handleAssaultWave);
    } else if (currentRound === 5) {
      // End game with Rebel victory
      yield put(displayModal('REBEL_VICTORY'));
      track(MISSION_NAME, 'victory', 'round');
      break;
    }

    yield call(setRandomDeploymentPoint);
    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(helperInitialSetup, missions[MISSION_NAME].initialGroups);
  yield call(helperEventModal, {
    text: [
      'The heroes control {ELITE}Chewbacca{END} as an ally at no additional cost.',
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

  // Deploy Chewbacca
  yield put(addToRoster('chewbacca'));

  yield call(helperMissionBriefing, [
    'Rebel mission tokens represent Wookiees.',
    'An Imperial figure can interact with a Wookiee to bind it. Flip the token to the Imperial side.',
    'A healthy hero or {ELITE}Chewbacca{END} can interact ({STRENGTH} or {TECH}) with a bound Wookiee to free it. Flip the token to the Rebel side.',
  ]);

  yield put(missionSpecialSetupDone());
}

export function* celebration(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_CLOSEST_REBEL));
  yield put(setMoveTarget(TARGET_FREED_WOOKIE));
  // SET INITIAL DEPLOYMENT POINT
  yield call(setRandomDeploymentPoint);

  yield put(setCustomAI(CUSTOM_AI_WOOKIEE, NO_INTERACTION_EXCLUSION_LIST));

  yield all([
    fork(handleSpecialSetup),
    fork(handleWookieeBound),
    fork(handleAllWookieesBound),
    fork(
      handleHeroesWounded(MISSION_NAME, `${MISSION_NAME_S}_PRIORITY_TARGET_KILL_HERO`, 'chewbacca')
    ),
    fork(handleStatusPhaseBegin),
    fork(handleRoundEnd),
  ]);

  track('missionStart', MISSION_NAME);
  yield put(missionSagaLoadDone());
}
