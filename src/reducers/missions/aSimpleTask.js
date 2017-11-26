// @flow

import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {
  getAreAllHeroesWounded,
  getIsOneHeroLeft,
  SET_REBEL_ESCAPED,
  WOUND_REBEL_HERO,
} from '../rebels';
import {
  MISSION_SPECIAL_SETUP,
  missionSpecialSetupDone,
  SET_MAP_STATE_ACTIVATED,
  setMapStateActivated,
  setDeploymentPoint,
  setPriorityTarget,
  statusPhaseEndRoundEffectsDone,
  STATUS_PHASE_END_ROUND_EFFECTS,
} from '../mission';
import {displayModal} from '../modal';
import {deployNewGroups} from '../imperials';
import helperIncreaseThreat from './helpers/helperIncreaseThreat';
import waitForModal from '../../sagas/waitForModal';

// Constants

const PRIORITY_TARGET_TERMINAL_1 = 'terminal 1';
const PRIORITY_TARGET_TERMINAL_2 = 'terminal 2';
const PRIORITY_TARGET_NEUTRAL = 'the formula';
const PRIORITY_TARGET_HERO_FORMULA =
  'the hero carrying the formula (if no hero then the formula itself)';
const PRIORITY_TARGET_REMAINING = 'the remaining hero';
const PRIORITY_TARGET_ENTRANCE = 'the entrance';

const DEPLOYMENT_POINT_GREEN_TERMINAL_1 = 'The green deployment point next to terminal 1';
const DEPLOYMENT_POINT_GREEN_TERMINAL_2 = 'The green deployment point next to the entrance';
const DEPLOYMENT_POINT_RED = 'If red deployment point next to the hero carrying the formula';

// Local state

let alarmsSounded = false;
let priorityTargetKillHero = false;

// Sagas

function* handleTerminalInteraction(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'terminal') {
      yield put(setMapStateActivated(1, 'door', value));
    } else if (id === 2 && type === 'terminal') {
      if (!alarmsSounded) {
        yield put(setMapStateActivated(2, 'door', value));
        yield put(setMapStateActivated(3, 'terminal', value));
      } else {
        yield put(setMapStateActivated(1, 'door', value));
        yield put(setMapStateActivated(1, 'terminal', value));
        // Change the targets and the deployment
        if (!priorityTargetKillHero) {
          yield put(setPriorityTarget(PRIORITY_TARGET_ENTRANCE));
        }
        yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN_TERMINAL_2));
      }
    } else if (id === 3 && type === 'terminal') {
      yield put(setMapStateActivated(2, 'door', value));
      if (!alarmsSounded) {
        yield put(setMapStateActivated(2, 'terminal', value));
      }
    }
  }
}

function* handleLightlyGuardedEvent(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'door' && value === true) {
      // Display a modal saying we're going to reinforce
      yield put(
        displayModal('RESOLVE_EVENT', {
          text: [
            'Resolve the Lightly Guarded event.',
            'The units should be deployed next to door 2.',
          ],
        })
      );
      yield call(waitForModal('RESOLVE_EVENT'));
      // Do the deployment from reserved groups
      yield put(deployNewGroups(['stormtrooper', 'imperialOfficer']));
      // Change target
      if (!priorityTargetKillHero) {
        yield put(setPriorityTarget(PRIORITY_TARGET_TERMINAL_2));
      }
      // We're done
      break;
    }
  }
}

function* handleTooQuietEvent(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 2 && type === 'door' && value === true) {
      // Display a modal saying we're going to reinforce
      yield put(
        displayModal('RESOLVE_EVENT', {
          text: ['Resolve the Too Quiet event.'],
        })
      );
      yield call(waitForModal('RESOLVE_EVENT'));
      // Change target
      if (!priorityTargetKillHero) {
        yield put(setPriorityTarget(PRIORITY_TARGET_NEUTRAL));
      }
      // We're done
      break;
    }
  }
}

function* handleSoundTheAlarmsEvent(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'neutral' && value === true) {
      alarmsSounded = true;
      // Display a modal saying we're going to reinforce
      yield put(
        displayModal('RESOLVE_EVENT', {
          text: [
            'Resolve the Sound the Alarams event.',
            'All doors are now closed and the threat has been raised.',
          ],
        })
      );
      yield call(waitForModal('RESOLVE_EVENT'));
      // Set all map states
      yield put(setMapStateActivated(1, 'door', false));
      yield put(setMapStateActivated(1, 'terminal', false));
      yield put(setMapStateActivated(2, 'door', false));
      yield put(setMapStateActivated(2, 'terminal', false));
      yield put(setMapStateActivated(3, 'terminal', false));
      // Increase threat
      yield call(helperIncreaseThreat, 2);
      // Change target
      if (!priorityTargetKillHero) {
        yield put(setPriorityTarget(PRIORITY_TARGET_HERO_FORMULA));
      }
      yield put(setDeploymentPoint(DEPLOYMENT_POINT_RED));
      // We're done
      break;
    }
  }
}

function* handleHeroEscapes(): Generator<*, *, *> {
  yield take(SET_REBEL_ESCAPED);
  // Just assume if someone escapes the rebels won
  // It's up to the player not to abuse the escape button
  yield put(displayModal('REBEL_VICTORY'));
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
      // PRIORITY TARGET SWITCH
      priorityTargetKillHero = true;
      yield put(setPriorityTarget(PRIORITY_TARGET_REMAINING));
    }
  }
}

// REQUIRED SAGA
function* handleRoundEnd(): Generator<*, *, *> {
  while (true) {
    yield take(STATUS_PHASE_END_ROUND_EFFECTS);
    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  // Double current threat
  yield call(helperIncreaseThreat, 2);
  // Do optional deployment from open groups which doesn't work right now...
  yield put(missionSpecialSetupDone());
}

export function* aSimpleTask(): Generator<*, *, *> {
  // SET PRIORITY TARGET
  yield put(setPriorityTarget(PRIORITY_TARGET_TERMINAL_1));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN_TERMINAL_1));

  yield all([
    fork(handleSpecialSetup),
    fork(handleTerminalInteraction),
    fork(handleLightlyGuardedEvent),
    fork(handleTooQuietEvent),
    fork(handleSoundTheAlarmsEvent),
    fork(handleHeroEscapes),
    fork(handleHeroesWounded),
    fork(handleRoundEnd),
  ]);
}
