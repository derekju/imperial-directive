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
  updateRebelVictory,
} from '../mission';
import {OPTIONAL_DEPLOYMENT_DONE, optionalDeployment, setCustomUnitAI} from '../imperials';
import {REFER_CAMPAIGN_GUIDE, TARGET_HERO_CLOSEST_UNWOUNDED} from './constants';
import {addToRoster} from '../rebels';
import createAction from '../createAction';
import {displayModal} from '../modal';
import handleHeroesWounded from './sharedSagas/handleHeroesWounded';
import handleStatusPhaseBegin from './sharedSagas/handleStatusPhaseBegin';
import helperDeploy from './helpers/helperDeploy';
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

const MISSION_NAME = 'theHardWay';
const MISSION_NAME_S = snakeCase(MISSION_NAME).toUpperCase();

const TARGET_DOOR_1 = 'door 1';
const TARGET_DOOR_2 = 'door 2';
const TARGET_DOOR_3 = 'door 3';
const TARGET_BROTHER = 'the closest Krandt Brother';

const DEPLOYMENT_POINT_GREEN = 'The east green deployment point';
const DEPLOYMENT_POINT_YELLOW = 'The yellow deployment point';
const DEPLOYMENT_POINT_RED = 'The red deployment point';

const CUSTOM_KRANDT_BROTHER_AI = [
  {
    command:
      '{ACTION} Move adjacent to {ATTACK_TARGET}, then {ACTION} Attack {ATTACK_TARGET}, then move towards the closest friendly unit.',
    condition: 'If within 5 spaces of {ATTACK_TARGET}',
  },
  {
    command:
      '{ACTION} Move within 4 spaces and LOS of {ATTACK_TARGET}, then {ACTION} Attack {ATTACK_TARGET}, then move towards the closest friendly unit.',
    condition: 'If within 8 spaces of any target',
  },
  {
    command: '{ACTION} Move adjacent to {ATTACK_TARGET}.',
    condition: 'If not within 8 spaces of {ATTACK_TARGET}',
  },
  {
    command: 'Use Relentless ability',
    condition: 'Reaction - If attacking a target within 3 spaces',
  },
  {
    command: 'Use ACP Scattergun ability ability',
    condition: 'Reaction - If attacking an adjacent target',
  },
];

// Types

export type TheHardWayStateType = {
  allDoorsOpened: boolean,
  priorityTargetKillHero: boolean,
};

// State

const initialState = {
  allDoorsOpened: false,
  priorityTargetKillHero: false,
};

export default (state: TheHardWayStateType = initialState, action: Object) => {
  switch (action.type) {
    case `${MISSION_NAME_S}_PRIORITY_TARGET_KILL_HERO`:
      return {
        ...state,
        priorityTargetKillHero: action.payload,
      };
    case 'THE_HARD_WAY_ALL_DOORS_OPENED':
      return {
        ...state,
        allDoorsOpened: true,
      };
    default:
      return state;
  }
};

// Selectors

// const getState = (state: StateType) => state[MISSION_NAME];
export const getTheHardWayGoalText = (state: StateType): string[] => {
  let goals = [];

  const {allDoorsOpened} = state.theHardWay;

  if (!allDoorsOpened) {
    goals = goals.concat(['{BOLD}Current Goal:{END}', 'Open all doors.', '{BREAK}']);
  } else {
    goals = goals.concat([
      '{BOLD}Krandt Brothers{END}',
      'Are incapacitated when defeated and cannot move or attack.',
      '{BREAK}',
      'A Rebel figure can interact with an incapacitated brother ({STRENGTH} or {INSIGHT}) to place a strain token.',
      '{BREAK}',
      'When each brother has 2 or more strain tokens, click the button below.',
      '{BREAK}',
      '---PLACEHOLDER_ALL_STRAIN_TOKENS---',
    ]);
  }

  goals = goals.concat(['{BOLD}Doors:{END}', 'Locked to Imperial figures.']);

  return goals;
};

// Sagas

function* handleAssault(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'door' && value === true) {
      track(MISSION_NAME, 'assault', 'triggered');

      yield call(
        helperDeploy,
        'Assault',
        REFER_CAMPAIGN_GUIDE,
        ['An Imperial Officer will now be deployed.'],
        ['imperialOfficer', 'Deploy to the yellow deployment point.']
      );

      yield put(setDeploymentPoint(DEPLOYMENT_POINT_YELLOW));

      yield call(helperEventModal, {
        text: [
          'The threat has been increased by twice the threat level.',
          'An optional deployment will now be done.',
        ],
        title: 'Assault',
      });

      // Double current threat
      yield call(helperIncreaseThreat, 2);
      // Do optional deployment
      yield put(optionalDeployment());
      yield take(OPTIONAL_DEPLOYMENT_DONE);

      yield put(setMoveTarget(TARGET_DOOR_2));

      // We're done
      break;
    }
  }
}

function* handleBodyguards(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 2 && type === 'door' && value === true) {
      track(MISSION_NAME, 'bodyguards', 'triggered');

      yield call(helperEventModal, {
        text: [
          'The threat has been increased by the threat level.',
          'An optional deployment will now be done.',
        ],
        title: 'Bodyguards',
      });

      // Incrase current threat
      yield call(helperIncreaseThreat, 1);
      // Do optional deployment
      yield put(optionalDeployment());
      yield take(OPTIONAL_DEPLOYMENT_DONE);

      yield put(setMoveTarget(TARGET_DOOR_3));

      // We're done
      break;
    }
  }
}

function* handleNegotiations(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 3 && type === 'door' && value === true) {
      track(MISSION_NAME, 'negotiations', 'triggered');

      yield put(createAction('THE_HARD_WAY_ALL_DOORS_OPENED'));

      yield put(setDeploymentPoint(DEPLOYMENT_POINT_RED));

      yield call(helperEventModal, {
        text: ['The threat has been increased by the threat level.'],
        title: 'Negotiations',
      });

      // Incrase current threat
      yield call(helperIncreaseThreat, 1);

      yield call(
        helperDeploy,
        'Negotiations',
        '',
        [
          'An {ELITE}Elite Imperial Officer{END} and the Krandt Brothers ({ELITE}Elite Trandoshan Hunter{END} group) will now be deployed.',
        ],
        ['imperialOfficerElite', 'Deploy to the west edge of the Bunker (tile 23B).'],
        ['trandoshanHunterElite', 'Deploy to the west edge of the Bunker (tile 23B).']
      );

      yield call(helperEventModal, {
        text: [
          'When a Krandt Brother is defeated, he becomes incapacitated instead. He cannot attack or exit his space.',
          'A Rebel figure can interact with an incapacitated brother ({STRENGTH} or {INSIGHT}). Place 1 strain token on that Krandt Brother for each success.',
          'When each Krandt Brother has 2 or more strain tokens, the Rebels win.',
        ],
        title: 'Negotiations',
      });

      yield put(updateRebelVictory('When each Krandt Brother has 2 or more strain tokens'));

      yield put(setCustomUnitAI('trandoshanHunterElite', CUSTOM_KRANDT_BROTHER_AI));
      yield put(setMoveTarget(TARGET_BROTHER));

      // We're done
      break;
    }
  }
}

function* handleAllTokensPlaced(): Generator<*, *, *> {
  yield take('THE_HARD_WAY_ALL_TOKENS_PLACED');
  yield put(displayModal('REBEL_VICTORY'));
  track(MISSION_NAME, 'victory', 'strain');
}

// REQUIRED SAGA
function* handleRoundEnd(): Generator<*, *, *> {
  while (true) {
    yield take(STATUS_PHASE_END_ROUND_EFFECTS);
    const currentRound = yield select(getCurrentRound);

    if (currentRound === 7) {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      track(MISSION_NAME, 'defeat', 'round');
      break;
    }

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

  yield call(helperMissionBriefing, ['Doors are locked to Imperial figures.']);

  yield put(missionSpecialSetupDone());
}

export function* theHardWay(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
  yield put(setMoveTarget(TARGET_DOOR_1));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN));

  yield all([
    fork(handleSpecialSetup),
    fork(handleAssault),
    fork(handleBodyguards),
    fork(handleNegotiations),
    fork(handleAllTokensPlaced),
    fork(handleHeroesWounded(MISSION_NAME, `${MISSION_NAME_S}_PRIORITY_TARGET_KILL_HERO`)),
    fork(handleStatusPhaseBegin),
    fork(handleRoundEnd),
  ]);

  track('missionStart', MISSION_NAME);
  yield put(missionSagaLoadDone());
}
