// @flow

import {all, call, cancel, fork, put, select, take} from 'redux-saga/effects';
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
import {OPTIONAL_DEPLOYMENT_DONE, optionalDeployment, setImperialUnitHpBuff} from '../imperials';
import {REFER_CAMPAIGN_GUIDE, TARGET_HERO_CLOSEST_UNWOUNDED} from './constants';
import {displayModal} from '../modal';
import handleHeroesWounded from './sharedSagas/handleHeroesWounded';
import handleStatusPhaseBegin from './sharedSagas/handleStatusPhaseBegin';
import helperDeploy from './helpers/helperDeploy';
import helperEventModal from './helpers/helperEventModal';
import helperIncreaseThreat from './helpers/helperIncreaseThreat';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import missions from '../../data/missions';
import snakeCase from 'lodash/snakeCase';
import type {StateType} from '../types';
import track from '../../lib/track';

// Constants

const MISSION_NAME = 'infection';
const MISSION_NAME_S = snakeCase(MISSION_NAME).toUpperCase();

const TARGET_DOOR_1 = 'door 1';
const TARGET_DOOR_2 = 'door 2';
const TARGET_DOOR_3 = 'door 3';
const TARGET_TERMINAL = 'the terminal';

const DEPLOYMENT_POINT_GREEN = 'The south green deployment point';
const DEPLOYMENT_POINT_BLUE = 'The blue deployment point';
const DEPLOYMENT_POINT_RED = 'The red deployment point';

// Types

export type InfectionStateType = {
  priorityTargetKillHero: boolean,
};

// State

const initialState = {
  priorityTargetKillHero: false,
};

export default (state: InfectionStateType = initialState, action: Object) => {
  switch (action.type) {
    case `${MISSION_NAME_S}_PRIORITY_TARGET_KILL_HERO`:
      return {
        ...state,
        priorityTargetKillHero: action.payload,
      };
    default:
      return state;
  }
};

// Selectors

// const getState = (state: StateType) => state[MISSION_NAME];
export const getInfectionGoalText = (state: StateType): string[] => {
  let goals = [];
  goals = goals.concat([
    '{BOLD}Doors:{END}',
    'Locked. A figure can attack (Health: 5, Defense: 1 {BLOCK}) or interact (2 {TECH}) to open.',
    '{BREAK}',
    '{BOLD}Uploading Virus:{END}',
    'A hero can interact with the terminal (3 {TECH} or {INSIGHT}) to upload the virus.',
    '{BREAK}',
  ]);

  return goals;
};

// Sagas

function* handleNemesis(): Generator<*, *, *> {
  track(MISSION_NAME, 'nemesis', 'triggered');

  const missionThreat = yield select(getMissionThreat);
  yield call(
    helperDeploy,
    'Nemesis',
    REFER_CAMPAIGN_GUIDE,
    [
      'A {ELITE}Royal Guard Champion{END} will now be deployed.',
      `He gains ${missionThreat} Health.`,
    ],
    ['royalGuardChampion', 'Deploy to the yellow point.']
  );
  yield put(setImperialUnitHpBuff('royalGuardChampion', missionThreat));
}

function* handleSecurityBreach(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'door' && value === true) {
      track(MISSION_NAME, 'securityBreach', 'triggered');

      yield put(setDeploymentPoint(DEPLOYMENT_POINT_BLUE));
      yield call(helperEventModal, {
        text: [
          'The threat has been increased by the threat level.',
          'An optional deployment will now be done.',
        ],
        title: 'Security Breach',
      });

      // Increase threat
      yield call(helperIncreaseThreat, 1);
      // Do optional deployment
      yield put(optionalDeployment());
      yield take(OPTIONAL_DEPLOYMENT_DONE);

      yield put(setMoveTarget(TARGET_DOOR_2));

      // We're done
      break;
    }
  }
}

function* handleGuarded(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 2 && type === 'door' && value === true) {
      track(MISSION_NAME, 'guarded', 'triggered');

      yield put(setDeploymentPoint(DEPLOYMENT_POINT_RED));
      yield call(
        helperDeploy,
        'Nemesis',
        'The guards were waiting for you.',
        ['A Royal Guard group will now be deployed.'],
        ['royalGuard', 'Deploy to the red point.']
      );

      yield put(setMoveTarget(TARGET_DOOR_3));

      // We're done
      break;
    }
  }
}

function* handleDoor3(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 3 && type === 'door' && value === true) {
      yield put(setMoveTarget(TARGET_TERMINAL));

      // We're done
      break;
    }
  }
}

function* handleVirusUploaded(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'terminal' && value === true) {
      yield put(displayModal('REBEL_VICTORY'));
      track(MISSION_NAME, 'victory', 'virus');
      yield cancel();
      // We're done
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
      yield call(handleNemesis);
    } else if (currentRound === 6) {
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

  yield call(helperMissionBriefing, [
    'Doors are locked. A figure can attack (Health: 5, Defense: 1 {BLOCK}) or interact (2 {TECH}) to open them.',
    'A hero can interact with the terminal (3 {TECH} or {INSIGHT}) to upload the virus.',
  ]);

  yield put(missionSpecialSetupDone());
}

export function* infection(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
  yield put(setMoveTarget(TARGET_DOOR_1));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN));

  yield all([
    fork(handleSpecialSetup),
    fork(handleSecurityBreach),
    fork(handleGuarded),
    fork(handleDoor3),
    fork(handleVirusUploaded),
    fork(handleHeroesWounded(MISSION_NAME, `${MISSION_NAME_S}_PRIORITY_TARGET_KILL_HERO`)),
    fork(handleStatusPhaseBegin),
    fork(handleRoundEnd),
  ]);

  track('missionStart', MISSION_NAME);
  yield put(missionSagaLoadDone());
}
