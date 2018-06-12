// @flow

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
import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {OPTIONAL_DEPLOYMENT_DONE, optionalDeployment} from '../imperials';
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
import {missionSagaLoadDone} from '../app';
import {REFER_CAMPAIGN_GUIDE, TARGET_CLOSEST_REBEL} from './constants';
import roll from '../../lib/roll';
import type {StateType} from '../types';
import track from '../../lib/track';

// Constants

const TARGET_SAFE_DOOR = 'the door to the Safe (tile 36B)';
const TARGET_DOCKING_BAY_DOOR = 'the door to the Docking Bay (tile 01B)';
const TARGET_TERMINAL = 'the terminal';

const DEPLOYMENT_POINT_GREEN_N = 'The north green deployment point';
const DEPLOYMENT_POINT_GREEN_S = 'The south green deployment point';
const DEPLOYMENT_POINT_YELLOW = 'The yellow deployment point';

// Types

export type HuntedDownStateType = {
  priorityTargetKillHero: boolean,
  yellowPointActive: boolean,
};

// State

const initialState = {
  priorityTargetKillHero: false,
  yellowPointActive: false,
};

export default (state: HuntedDownStateType = initialState, action: Object) => {
  switch (action.type) {
    case 'HUNTED_DOWN_PRIORITY_TARGET_KILL_HERO':
      return {
        ...state,
        priorityTargetKillHero: action.payload,
      };
    case 'HUNTED_DOWN_YELLOW_POINT_ACTIVE':
      return {
        ...state,
        yellowPointActive: true,
      };
    default:
      return state;
  }
};

// Selectors

const getState = (state: StateType) => state.huntedDown;
export const getHuntedDownGoalText = (state: StateType): string[] => {
  let goals = [];

  goals = goals.concat([
    '{BOLD}Door to the Safe:{END}',
    'A Rebel figure can attack (Health: 8, Defense: 1 {BLOCK}) or interact (3 {INSIGHT}) to open it.',
    '{BREAK}',
    '{BOLD}Chip (Rebel mission token):{END}',
    'A Healthy Rebel figure can interact to retrieve it.',
    '{BREAK}',
    '{BOLD}Terminal:{END}',
    'While carrying the chip, a hero or {ELITE}Han Solo{END} can interact with the terminal ({TECH}) to upload the docking codes.',
  ]);

  return goals;
};

// Sagas

function getRandomDeploymentPoint() {
  if (roll(50)) {
    return DEPLOYMENT_POINT_GREEN_N;
  } else {
    return DEPLOYMENT_POINT_GREEN_S;
  }
}

function* handleOnTheTrail(): Generator<*, *, *> {
  track('huntedDown', 'onTheTrail', 'triggered');
  yield call(helperIncreaseThreat, 1);
  yield call(
    helperDeploy,
    'On the Trail',
    REFER_CAMPAIGN_GUIDE,
    [
      'The threat has been increased by the threat level.',
      'Deploy {ELITE}Boba Fett{END} to the red point.',
    ],
    ['bobaFett', 'Deploy to the red point.']
  );
}

function* handleFinalDefense(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 2 && type === 'door' && value === true) {
      track('huntedDown', 'finalDefense', 'triggered');

      yield call(helperIncreaseThreat, 1);
      yield call(
        helperDeploy,
        'Final Defense',
        REFER_CAMPAIGN_GUIDE,
        [
          'The threat has been increased by the threat level.',
          'An Imperial Officer and a Stormtrooper group will now be deployed.',
        ],
        ['imperialOfficer', 'Deploy to the blue deployment point.'],
        ['stormtrooper', 'Deploy to the blue deployment point.']
      );
      // Switch deployment to yellow point
      yield put(setDeploymentPoint(DEPLOYMENT_POINT_YELLOW));
      yield put(createAction('HUNTED_DOWN_YELLOW_POINT_ACTIVE'));
      yield put(setMoveTarget(TARGET_TERMINAL));
      // We're done
      break;
    }
  }
}

function* handleChipObtained(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'rebel' && value === true) {
      yield put(setMoveTarget(TARGET_DOCKING_BAY_DOOR));
      // We're done
      break;
    }
  }
}

function* handleDockingCodesUploaded(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'terminal' && value === true) {
      // End game with Rebel victory
      yield put(displayModal('REBEL_VICTORY'));
      track('huntedDown', 'victory', 'dockingCodes');
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
      yield call(handleOnTheTrail);
    } else if (currentRound === 6) {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      track('huntedDown', 'defeat', 'round');
      break;
    }

    // Change deployment point to a random one at the end of each round if the yellow point is not
    // active
    const {yellowPointActive} = yield select(getState);
    if (!yellowPointActive) {
      yield put(setDeploymentPoint(getRandomDeploymentPoint()));
    }
    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(helperInitialSetup, ['heavyStormtrooper', 'probeDroid', 'stormtrooper']);
  yield call(helperEventModal, {
    text: [
      'The heroes control {ELITE}Han Solo{END} as an ally at no additional cost.',
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

  // Deploy Luke
  yield put(addToRoster('han'));

  yield call(helperMissionBriefing, [
    'The door to the Safe (tile 36B) is locked. A Rebel figure can attack the door (Health: 8, Defense: 1 {BLOCK}) or interact (3 {INSIGHT}) to open it.',
    'The Rebel mission token is the data chip. A Healthy Rebel figure can interact to retrieve it.',
    'While carrying the chip, a hero or {ELITE}Han Solo{END} can interact with the terminal ({TECH}) to upload the docking codes.',
  ]);
  yield put(missionSpecialSetupDone());
}

export function* huntedDown(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_CLOSEST_REBEL));
  yield put(setMoveTarget(TARGET_SAFE_DOOR));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(getRandomDeploymentPoint()));

  yield all([
    fork(handleSpecialSetup),
    fork(handleFinalDefense),
    fork(handleChipObtained),
    fork(handleDockingCodesUploaded),
    fork(handleHeroesWounded('huntedDown', 'HUNTED_DOWN_PRIORITY_TARGET_KILL_HERO', 'han')),
    fork(handleStatusPhaseBegin),
    fork(handleRoundEnd),
  ]);

  track('missionStart', 'huntedDown');
  yield put(missionSagaLoadDone());
}
