// @flow

import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {getAreAllHeroesWounded, getIsOneHeroLeft, WOUND_REBEL_HERO} from '../rebels';
import {
  getCurrentRound,
  getMapStates,
  MISSION_SPECIAL_SETUP,
  missionSpecialSetupDone,
  SET_MAP_STATE_ACTIVATED,
  setAttackTarget,
  setDeploymentPoint,
  setMoveTarget,
  statusPhaseEndRoundEffectsDone,
  STATUS_PHASE_END_ROUND_EFFECTS,
} from '../mission';
import {REFER_CAMPAIGN_GUIDE, TARGET_REMAINING} from './constants';
import {displayModal} from '../modal';
import helperDeploy from './helpers/helperDeploy';
import waitForModal from '../../sagas/waitForModal';

// Constants

const TARGET_DOOR = 'the door';
const TARGET_TERMINAL_2 = 'terminal 2';
const TARGET_NEAREST_TERMINAL = 'the nearest active terminal';

const DEPLOYMENT_POINT_GREEN = 'The green deployment point';
const DEPLOYMENT_POINT_RED =
  'If Lockdown option 2 was chosen: the red deployment point. Otherwise, the green deployment point';

// Local state

let requireEndRoundEffects = false;
let priorityTargetKillHero = false;

// Sagas

function* handleLockDownEvent(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'door' && value === true) {
      requireEndRoundEffects = true;
      // Ok, this is the round the rebels opened the door so wait until end of round to trigger
      yield take(STATUS_PHASE_END_ROUND_EFFECTS);
      // Pick which one we'll do and then do it
      yield put(
        displayModal('RESOLVE_EVENT', {
          story: 'Sirens blare as the outpost goes into lockdown mode.',
          text: [
            'If there is a rebel figure west of the door, close the door to the Atrium. A Rebel figure can attack the door (Health: 8, Defense: 1 black die) to open it.',
            'Otherwise, each terminal has 7 Health now instead of 4.',
          ],
          title: 'Lockdown',
        })
      );
      yield call(waitForModal('RESOLVE_EVENT'));
      yield put(setDeploymentPoint(DEPLOYMENT_POINT_RED));
      // We're done
      requireEndRoundEffects = false;
      yield put(statusPhaseEndRoundEffectsDone());
      break;
    }
  }
}

function* handleFortifiedEvent(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'door' && value === true) {
      yield call(
        helperDeploy,
        REFER_CAMPAIGN_GUIDE,
        [
          'Deploy an E-Web Engineer to the Yellow deployment point in the Atrium. That figure becomes focused.',
          'Deploy a Stormtrooper group and an Imperial Officer to the right side of the Storage room.',
        ],
        'Fortified',
        ['eWebEngineer', 'stormtrooper', 'imperialOfficer']
      );
      // PRIORITY TARGET SWITCH #2
      if (!priorityTargetKillHero) {
        yield put(setMoveTarget(TARGET_TERMINAL_2));
      }
      // We're done
      break;
    }
  }
}

function* handleSingleTerminalDestroyed(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 2 && type === 'terminal' && value === true) {
      // PRIORITY TARGET SWITCH #3
      if (!priorityTargetKillHero) {
        yield put(setMoveTarget(TARGET_NEAREST_TERMINAL));
      }
      // We're done
      break;
    }
  }
}

function* handleTerminalsDestroyed(): Generator<*, *, *> {
  while (true) {
    yield take(SET_MAP_STATE_ACTIVATED);
    const mapStates = yield select(getMapStates);
    // Now check all 4 terminals, if they are activated, then game over for rebels
    if (
      mapStates['terminal-1'].activated &&
      mapStates['terminal-2'].activated &&
      mapStates['terminal-3'].activated &&
      mapStates['terminal-4'].activated
    ) {
      yield put(displayModal('REBEL_VICTORY'));
      // We're done
      break;
    }
  }
}

function* handleHeroesWounded(): Generator<*, *, *> {
  while (true) {
    yield take(WOUND_REBEL_HERO);
    const allWounded = yield select(getAreAllHeroesWounded);
    if (allWounded) {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      break;
    }
    const isOneHeroLeft = yield select(getIsOneHeroLeft);
    if (isOneHeroLeft) {
      // PRIORITY TARGET SWITCH #4
      priorityTargetKillHero = true;
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

    if (currentRound === 6) {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      // We're done, don't send statusPhaseEndRoundEffects so we stall the game out on purpose
      break;
    }

    if (!requireEndRoundEffects) {
      yield put(statusPhaseEndRoundEffectsDone());
    }
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield put(missionSpecialSetupDone());
}

/*
Priority target definitions:
1) Initial attack is default, move is door
2) Once door opens, move is terminal 2
3) If terminal 2 is down, move is nearest terminal
4) At any point if heroes - 1 are wounded, attack and move are the last remaining hero
*/
export function* aftermath(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setMoveTarget(TARGET_DOOR));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN));

  yield all([
    fork(handleSpecialSetup),
    fork(handleLockDownEvent),
    fork(handleFortifiedEvent),
    fork(handleSingleTerminalDestroyed),
    fork(handleTerminalsDestroyed),
    fork(handleHeroesWounded),
    fork(handleRoundEnd),
  ]);
}
