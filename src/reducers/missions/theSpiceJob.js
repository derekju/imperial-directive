// @flow

import {
  addToRoster,
  getAreAllHeroesWounded,
  getIsOneHeroLeft,
  getWoundedOther,
  WOUND_REBEL_HERO,
  WOUND_REBEL_OTHER,
} from '../rebels';
import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {
  getCurrentRound,
  getMapStates,
  MISSION_SPECIAL_SETUP,
  missionSpecialSetupDone,
  SET_MAP_STATE_ACTIVATED,
  setAttackTarget,
  setDeploymentPoint,
  setMapStateVisible,
  setMoveTarget,
  STATUS_PHASE_END_ROUND_EFFECTS,
  statusPhaseEndRoundEffectsDone,
} from '../mission';
import {getCurrentGroups, OPTIONAL_DEPLOYMENT_DONE, optionalDeployment} from '../imperials';
import {displayModal} from '../modal';
import {getMissionThreat} from '../app';
import handleStatusPhaseBegin from './sharedSagas/handleStatusPhaseBegin';
import helperDeploy from './helpers/helperDeploy';
import helperEventModal from './helpers/helperEventModal';
import helperIncreaseThreat from './helpers/helperIncreaseThreat';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import {missionSagaLoadDone} from '../app';
import {REFER_CAMPAIGN_GUIDE, TARGET_CLOSEST_REBEL, TARGET_REMAINING} from './constants';
import type {StateType} from '../types';
import track from '../../lib/track';

// Constants

const TARGET_CHEWBACCA = 'Chewbacca';
const TARGET_SPICE = 'the closest spice barrel';

const DEPLOYMENT_POINT_GREEN_NW = 'The north western green deployment point';
const DEPLOYMENT_POINT_GREEN_E = 'The eastern green deployment point';
const DEPLOYMENT_POINT_GREEN_S = 'The southern green deployment point';

// Types

export type TheSpiceJobStateType = {
  keycardAcquired: boolean,
};

// State

const initialState = {
  keycardAcquired: false,
};

export default (state: TheSpiceJobStateType = initialState, action: Object) => {
  switch (action.type) {
    case 'SPICE_JOB_GET_KEYCARD':
      return {
        ...state,
        keycardAcquired: true,
      };
    default:
      return state;
  }
};

// Selectors

export const getTheSpiceJobGoalText = (state: StateType): string[] => {
  let goals = [];

  goals = goals.concat([
    '{BOLD}Spice Barrel:{END}',
    'A healthy hero or {ELITE}Chewbacca{END} can interact ({STRENGTH}) to claim.',
    '{BREAK}',
    '{BOLD}Doors:{END}',
    'Locked. Can be opened by a Rebel figure carrying the keycard.',
    '{BREAK}',
  ]);

  if (!state.theSpiceJob.keycardAcquired) {
    goals = goals.concat([
      '{BOLD}Keycard:{END}',
      'The keycard is a yellow neutral token. Defeat an Imperial figure carrying a neutral mission token to have them drop it.',
      '{BREAK}',
      'Interact with the dropped token to retrieve.',
      '{BREAK}',
    ]);
  }

  return goals;
};

// Sagas

function* sharedAttackOrRaiseThreat(): Generator<*, *, *> {
  const missionThreat = yield select(getMissionThreat);
  const {deployedGroups} = yield select(getCurrentGroups);
  // 2 or 3 threat not worth it, just do an attack. Map is pretty small so assuming someone can always attack
  // but double check we even have any units left to attack with
  if (deployedGroups.length > 0 && missionThreat < 4) {
    yield call(helperEventModal, {
      story:
        'With their last gasp, the Imperial hits the panic button alerting everyone to your presence.',
      text: [
        'An imperial figure can interrupt to perform an attack.',
        'Use the Imperial figure closest to {ELITE}Chewbacca{END} to do the attack if possible.',
        'Otherwise, use the Imperial figure closest to an unwounded hero.',
      ],
      title: 'Defend the Spice',
    });
  } else {
    yield call(helperEventModal, {
      story:
        'With their last gasp, the Imperial hits the panic button alerting everyone to your presence.',
      text: ['The threat has been increased.'],
      title: 'Defend the Spice',
    });
    yield call(helperIncreaseThreat, 1);
  }
}

function* handleBackRoomEvent(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (type === 'door' && value === true) {
      track('theSpiceJob', 'theBackRoom', 'triggered');
      yield call(
        helperDeploy,
        'The Back Room',
        REFER_CAMPAIGN_GUIDE,
        ['An E-Web Engineer will now be deployed.'],
        ['eWebEngineer', 'Deploy to the yellow point.']
      );

      yield call(sharedAttackOrRaiseThreat);

      if (id === 1) {
        yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN_NW));
      } else {
        yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN_S));
      }

      break;
    }
  }
}

function* handleGetKeycard(): Generator<*, *, *> {
  yield take('SPICE_JOB_GET_KEYCARD');
  track('theSpiceJob', 'defendTheSpice', 'triggered');
  yield call(sharedAttackOrRaiseThreat);
}

function* handleSpiceClaimed(): Generator<*, *, *> {
  while (true) {
    yield take(SET_MAP_STATE_ACTIVATED);
    const mapStates = yield select(getMapStates);
    const results = [];
    if (mapStates['imperial-1'].activated) {
      yield put(setMapStateVisible(1, 'imperial', false));
      results.push('imperial-1');
    }
    if (mapStates['imperial-2'].activated) {
      yield put(setMapStateVisible(2, 'imperial', false));
      results.push('imperial-2');
    }
    if (mapStates['imperial-3'].activated) {
      yield put(setMapStateVisible(3, 'imperial', false));
      results.push('imperial-3');
    }
    if (mapStates['imperial-4'].activated) {
      yield put(setMapStateVisible(4, 'imperial', false));
      results.push('imperial-4');
    }
    if (mapStates['imperial-5'].activated) {
      yield put(setMapStateVisible(5, 'imperial', false));
      results.push('imperial-5');
    }
    if (mapStates['imperial-6'].activated) {
      yield put(setMapStateVisible(6, 'imperial', false));
      results.push('imperial-6');
    }

    if (results.length === 6) {
      yield put(displayModal('REBEL_VICTORY'));
      track('theSpiceJob', 'victory', 'spice');
      // We're done
      break;
    }
  }
}

function* handleChewbaccaDefeated(): Generator<*, *, *> {
  while (true) {
    const action = yield take(WOUND_REBEL_OTHER);
    const {id} = action.payload;
    const allWounded = yield select(getAreAllHeroesWounded);
    // If chewy killed and all heroes are already dead
    if (id === 'chewbacca' && allWounded) {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      track('theSpiceJob', 'defeat', 'wounded');
      break;
    }
  }
}

function* handleHeroesWounded(): Generator<*, *, *> {
  while (true) {
    yield take(WOUND_REBEL_HERO);
    const allWounded = yield select(getAreAllHeroesWounded);
    const woundedOther = yield select(getWoundedOther);
    // If now all heroes are dead and so is chewy
    if (allWounded && woundedOther.includes('chewbacca')) {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      track('theSpiceJob', 'defeat', 'wounded');
      break;
    } else if (allWounded) {
      // If all heroes are dead but chewy still alive, focus fire on chewy
      yield put(setAttackTarget(TARGET_CHEWBACCA));
      yield put(setMoveTarget(TARGET_CHEWBACCA));
    }
    const isOneHeroLeft = yield select(getIsOneHeroLeft);
    // If only one hero left and chewy is dead, target last hero
    if (isOneHeroLeft && woundedOther.includes('chewbacca')) {
      // Switch targets
      yield put(setAttackTarget(TARGET_REMAINING));
      yield put(setMoveTarget(TARGET_REMAINING));
    }
  }
}

// REQUIRED SAGA
function* handleRoundEnd(): Generator<*, *, *> {
  while (true) {
    yield take(STATUS_PHASE_END_ROUND_EFFECTS);
    const currentRound = yield select(getCurrentRound);

    if (currentRound === 5) {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      track('theSpiceJob', 'defeat', 'rounds');
      break;
    }

    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(helperInitialSetup, ['nexuElite', 'probeDroid', 'trandoshanHunterElite']);
  yield call(helperEventModal, {
    text: [
      'Collect 2 red and 1 yellow neutral mission token. Shuffle them, keep them facedown, and place one randomly underneath both {ELITE}Trandoshan Hunter{END} figures and one underneath the Probe Droid.',
    ],
    title: 'Initial Setup',
  });
  yield call(helperEventModal, {
    text: [
      'The heroes control {ELITE}Chewbacca{END} as an ally.',
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

  // Deploy Chewy
  yield put(addToRoster('chewbacca'));

  yield call(helperMissionBriefing, [
    'Doors are locked to all figures. A Rebel figure carrying the keycard can open them.',
    'The yellow neutral mission token represents the keycard. After an Imperial figure with a neutral mission token under them is defeated, keep the neutral mission token facedown and place it where it was defeated.',
    'A Rebel figure can interact with a neutral mission token to reveal it.',
    'Imperial mission tokens are spice barrels. A healthy hero or {ELITE}Chewbacca{END} can interact with a spice barrel (test {STRENGTH}) to claim the token.',
  ]);
  yield put(missionSpecialSetupDone());
}

/*
Priority target definitions:
1) Initial is closest unwounded, move is closest spice
2) Once door opens, move is closest spice barrel
*/

export function* theSpiceJob(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_CLOSEST_REBEL));
  yield put(setMoveTarget(TARGET_SPICE));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN_E));

  yield all([
    fork(handleSpecialSetup),
    fork(handleBackRoomEvent),
    fork(handleGetKeycard),
    fork(handleSpiceClaimed),
    fork(handleChewbaccaDefeated),
    fork(handleHeroesWounded),
    fork(handleStatusPhaseBegin),
    fork(handleRoundEnd),
  ]);

  track('missionStart', 'theSpiceJob');
  yield put(missionSagaLoadDone());
}
