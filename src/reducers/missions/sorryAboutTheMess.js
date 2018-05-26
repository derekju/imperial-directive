// @flow

import {addToRoster, WOUND_REBEL_OTHER} from '../rebels';
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
import {
  DEFEAT_IMPERIAL_FIGURE,
  OPTIONAL_DEPLOYMENT_DONE,
  optionalDeployment,
  setImperialUnitHpBuff,
} from '../imperials';
import {REFER_CAMPAIGN_GUIDE} from './constants';
import {displayModal} from '../modal';
import {getMissionThreat} from '../app';
import handleStatusPhaseBegin from './sharedSagas/handleStatusPhaseBegin';
import helperDeploy from './helpers/helperDeploy';
import helperEventModal from './helpers/helperEventModal';
import helperIncreaseThreat from './helpers/helperIncreaseThreat';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import {missionSagaLoadDone} from '../app';
import type {StateType} from '../types';
import track from '../../lib/track';

// Constants

const TARGET_HAN = 'Han Solo';

const DEPLOYMENT_POINT_GREEN = 'The south west green deployment point';
const DEPLOYMENT_POINT_RED = 'The red deployment point';

// Selectors

export const getSorryAboutTheMessGoalText = (state: StateType): string[] => {
  const goals = [
    '{BOLD}Doors:{END}',
    'Doors are locked for all figures except for {ELITE}Han Solo{END}.',
  ];

  return goals;
};

// Sagas

function* handleGarageOpens(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const missionThreat = yield select(getMissionThreat);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'door' && value === true) {
      track('sorryAboutTheMess', 'oldFriends', 'triggered');
      // Deploy imperial officer
      yield call(
        helperDeploy,
        'Old Friends',
        REFER_CAMPAIGN_GUIDE,
        [
          'Deploy an {ELITE}Elite Imperial Officer{END} to the yellow point. This officer is Gerrin.',
          `Gerrin gains ${missionThreat * 2} extra Health.`,
          'An E-Web Engineer will now be deployed.',
        ],
        ['gerrin', 'Deploy to the yellow point.'],
        ['eWebEngineer', 'Deploy to the red point.']
      );
      yield put(setImperialUnitHpBuff('gerrin', missionThreat * 2));

      // Increase threat and do optional deployment to red point
      yield put(setDeploymentPoint(DEPLOYMENT_POINT_RED));
      yield call(helperEventModal, {
        text: ['The threat has been increased.', 'An optional deployment will now be done.'],
        title: 'Old Friends',
      });
      // Increase threat
      yield call(helperIncreaseThreat, 1);
      // Do optional deployment
      yield put(optionalDeployment());
      yield take(OPTIONAL_DEPLOYMENT_DONE);

      // Han gets to attack
      yield call(helperEventModal, {
        text: [
          '{ELITE}Han{END} may interrupt to perform an attack targeting Gerrin if he has LOS to Gerrin.',
          'The Rebels win if Gerrin is defeated.',
        ],
        title: 'Old Friends',
      });

      // Change goal
      yield put(updateRebelVictory('Defeat Gerrin'));
    }
  }
}

function* handleGerrinDefeated(): Generator<*, *, *> {
  while (true) {
    const action = yield take(DEFEAT_IMPERIAL_FIGURE);
    const {group} = action.payload;
    if (group.id === 'gerrin') {
      yield put(displayModal('REBEL_VICTORY'));
      track('sorryAboutTheMess', 'victory', 'gerrin');
      break;
    }
  }
}

function* handleHanSoloDefeated(): Generator<*, *, *> {
  while (true) {
    const action = yield take(WOUND_REBEL_OTHER);
    const {id} = action.payload;
    if (id === 'han') {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      track('sorryAboutTheMess', 'defeat', 'hanKilled');
      break;
    }
  }
}

function* handleRegularsEvent(): Generator<*, *, *> {
  track('sorryAboutTheMess', 'regulars', 'triggered');
  yield call(
    helperDeploy,
    'Regulars',
    'You sense the regular patrol approaching from behind.',
    ['An {ELITE}Elite Trandoshan Hunter{END} will now be deployed.'],
    ['trandoshanHunterElite', 'Deploy to the entrance.']
  );
}

// REQUIRED SAGA
function* handleRoundEnd(): Generator<*, *, *> {
  while (true) {
    yield take(STATUS_PHASE_END_ROUND_EFFECTS);
    const currentRound = yield select(getCurrentRound);

    if (currentRound === 2) {
      yield call(handleRegularsEvent);
    }

    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(helperInitialSetup, ['probeDroidElite', 'stormtrooper']);
  yield call(helperEventModal, {
    text: [
      'The heroes control {ELITE}Han Solo{END} as an ally.',
      'The threat has been increased.',
      'An optional deployment will now be done.',
    ],
    title: 'Initial Setup',
  });
  // Double current threat
  yield call(helperIncreaseThreat, 2);
  // Do optional deployment
  yield put(optionalDeployment());
  yield take(OPTIONAL_DEPLOYMENT_DONE);

  // Deploy Han
  yield put(addToRoster('han'));

  yield call(helperMissionBriefing, [
    'The door is locked to all figures except for {ELITE}Han Solo{END}.',
  ]);
  yield put(missionSpecialSetupDone());
}

/*
Priority target definitions:
1) Initial is han, move is han
*/

export function* sorryAboutTheMess(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_HAN));
  yield put(setMoveTarget(TARGET_HAN));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN));

  yield all([
    fork(handleSpecialSetup),
    fork(handleGarageOpens),
    fork(handleGerrinDefeated),
    fork(handleHanSoloDefeated),
    fork(handleStatusPhaseBegin),
    fork(handleRoundEnd),
  ]);

  track('missionStart', 'sorryAboutTheMess');
  yield put(missionSagaLoadDone());
}
