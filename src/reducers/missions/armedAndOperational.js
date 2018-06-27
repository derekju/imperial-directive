// @flow

import {addToRoster} from '../rebels';
import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {OPTIONAL_DEPLOYMENT_DONE, optionalDeployment} from '../imperials';
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
import {getMissionThreat, missionSagaLoadDone} from '../app';
import {REFER_CAMPAIGN_GUIDE, TARGET_CLOSEST_REBEL} from './constants';
import {displayModal} from '../modal';
import getRandomItem from '../utils/getRandomItem';
import handleHeroesWounded from './sharedSagas/handleHeroesWounded';
import handleStatusPhaseBegin from './sharedSagas/handleStatusPhaseBegin';
import helperDeploy from './helpers/helperDeploy';
import helperEventModal from './helpers/helperEventModal';
import helperIncreaseThreat from './helpers/helperIncreaseThreat';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import type {StateType} from '../types';
import track from '../../lib/track';

// Constants

const TARGET_DOOR_SITE = 'the door to the Testing Site';
const TARGET_WARSHIP = 'the warship';
const DEPLOYMENT_POINT_GREEN_N = 'The north deployment point';
const DEPLOYMENT_POINT_GREEN_E = 'The east green deployment point';
const DEPLOYMENT_POINT_BLUE = 'The blue deployment point';
const DEPLOYMENT_POINT_YELLOW = 'The yellow deployment point';

// Types

export type ArmedAndOperationalStateType = {
  priorityTargetKillHero: boolean,
};

// State

const initialState = {
  priorityTargetKillHero: false,
};

export default (state: ArmedAndOperationalStateType = initialState, action: Object) => {
  switch (action.type) {
    case 'ARMED_AND_OPERATIONAL_PRIORITY_TARGET_KILL_HERO':
      return {
        ...state,
        priorityTargetKillHero: action.payload,
      };
    default:
      return state;
  }
};

// Selectors

export const getArmedAndOperationalGoalText = (state: StateType): string[] => {
  const missionThreat = state.app.missionThreat;

  let goals = [];
  goals = goals.concat([
    '{BOLD}Rebel Saboteurs:{END}',
    `Gain ${missionThreat *
      2} health. When attacked and adjacent to a healthy hero, the hero can suffer 2 {STRAIN} to become target instead.`,
    '{BREAK}',
    '{BOLD}Warship:{END}',
    `Adjacent blocked spaces on the Testing Site are the warship. A figure can attack the warship (Health: ${10 +
      missionThreat * 2}, Defense: ${missionThreat} {BLOCK}).`,
    '{BREAK}',
    'A Rebel Saboteur can interact with the warship to deal 5 {DAMAGE} to it. Limit once per figure per round.',
    '{BREAK}',
  ]);

  return goals;
};

// Sagas

function getRandomDeploymentPoint() {
  return getRandomItem(DEPLOYMENT_POINT_GREEN_N, DEPLOYMENT_POINT_GREEN_E);
}

function* handleOuterDefenses(): Generator<*, *, *> {
  track('armedAndOperational', 'outerDefenses', 'triggered');
  yield call(helperIncreaseThreat, 1);
  yield call(
    helperDeploy,
    'Outer Defenses',
    REFER_CAMPAIGN_GUIDE,
    [
      'The threat has been increased by the threat level.',
      'An E-Web Engineer will now be deployed.',
    ],
    ['eWebEngineer', 'Deploy to the yellow deployment point.']
  );
  // Switch deployment to yellow point
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_YELLOW));
}

function* handleTestingSiteDoor(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'door' && value === true) {
      yield call(helperIncreaseThreat, 1);
      yield call(
        helperDeploy,
        'Outer Defenses',
        REFER_CAMPAIGN_GUIDE,
        [
          'The threat has been increased by the threat level.',
          'An Imperial Officer and a Trandoshan Hunter group will now be deployed.',
        ],
        ['imperialOfficer', 'Deploy to the red deployment point.'],
        ['trandoshanHunter', 'Deploy to the red deployment point.']
      );
      yield put(setMoveTarget(TARGET_WARSHIP));
      // Switch deployment to blue point
      yield put(setDeploymentPoint(DEPLOYMENT_POINT_BLUE));
    }
  }
}

function* handleWarshipDestroyed(): Generator<*, *, *> {
  yield take('ARMED_AND_OPERATIONAL_WARSHIP_DESTROYED');
  yield put(displayModal('REBEL_VICTORY'));
  track('armedAndOperational', 'victory', 'warship');
}

// REQUIRED SAGA
function* handleRoundEnd(): Generator<*, *, *> {
  while (true) {
    yield take(STATUS_PHASE_END_ROUND_EFFECTS);
    const currentRound = yield select(getCurrentRound);

    if (currentRound === 1) {
      yield call(handleOuterDefenses);
    } else if (currentRound === 6) {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      track('armedAndOperational', 'defeat', 'round');
      break;
    }

    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(helperInitialSetup, ['imperialOfficer', 'probeDroid', 'stormtrooperElite']);
  yield call(helperEventModal, {
    text: [
      'The heroes control the Rebel Saboteurs as an ally.',
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

  // Deploy Rebel Saboteurs
  yield put(addToRoster('rebelSaboteur'));

  const missionThreat = yield select(getMissionThreat);

  yield call(helperMissionBriefing, [
    `Rebel Saboteurs gain ${missionThreat *
      2} health. When they are attacked and adjacent to a healthy hero, the hero can suffer 2 {STRAIN} to become the target instead.`,
    `The adjacent blocked spaces on the Testing Site are the warship. A figure can attack the warship (Health: ${10 +
      missionThreat * 2}, Defense: ${missionThreat} {BLOCK}).`,
    'A Rebel Saboteur can interact with the warship to deal 5 {DAMAGE} to it. Limit once per figure per round.',
  ]);
  yield put(missionSpecialSetupDone());
}

/*
Priority target definitions:
1) Initial attack is closest Rebel, move is the door
2) Once door is open move is the warship
*/
export function* armedAndOperational(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_CLOSEST_REBEL));
  yield put(setMoveTarget(TARGET_DOOR_SITE));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(getRandomDeploymentPoint()));

  yield all([
    fork(handleSpecialSetup),
    fork(handleTestingSiteDoor),
    fork(handleWarshipDestroyed),
    fork(
      handleHeroesWounded('armedAndOperational', 'ARMED_AND_OPERATIONAL_PRIORITY_TARGET_KILL_HERO')
    ),
    fork(handleStatusPhaseBegin),
    fork(handleRoundEnd),
  ]);

  track('missionStart', 'armedAndOperational');
  yield put(missionSagaLoadDone());
}
