// @flow

import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {getAreAllHeroesWounded, getIsOneHeroLeft, WOUND_REBEL_HERO} from '../rebels';
import {
  getCurrentRound,
  getMapStates,
  SET_MAP_STATE_ACTIVATED,
  setPriorityTarget,
  statusPhaseEndRoundEffectsDone,
  STATUS_PHASE_END_ROUND_EFFECTS,
} from '../mission';
import {displayModal} from '../modal';
import {deployNewGroups} from '../imperials';
import waitForModal from '../../sagas/waitForModal';

// Constants

const PRIORITY_TARGET_DOOR = 'the door';
const PRIORITY_TARGET_TERMINAL_2 = 'terminal 2';
const PRIORITY_TARGET_NEAREST_TERMINAL = 'the nearest active terminal';
const PRIORITY_TARGET_MOST_WOUNDED = 'the most wounded hero';

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
      yield put(displayModal('AFTERMATH_LOCKDOWN'));
      yield call(waitForModal('AFTERMATH_LOCKDOWN'));
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
      // Display a modal saying we're going to reinforce
      yield put(displayModal('RESOLVE_EVENT', {eventName: 'Fortified'}));
      yield call(waitForModal('RESOLVE_EVENT'));
      // Do the deployment from reserved groups
      yield put(deployNewGroups(['eWebEngineer', 'stormtrooper', 'imperialOfficer']));
      // PRIORITY TARGET SWITCH #2
      if (!priorityTargetKillHero) {
        yield put(setPriorityTarget(PRIORITY_TARGET_TERMINAL_2));
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
        yield put(setPriorityTarget(PRIORITY_TARGET_NEAREST_TERMINAL));
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
      yield put(setPriorityTarget(PRIORITY_TARGET_MOST_WOUNDED));
    }
  }
}

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

/*
Priority target definitions:
1) Initial is door
2) Once door opens, target is terminal 2
3) If terminal 2 is down, target is nearest terminal
4) At any point if heroes - 1 are wounded, target is the last remaining hero
*/

export function* aftermath(): Generator<*, *, *> {
  // Initially set to door
  yield put(setPriorityTarget(PRIORITY_TARGET_DOOR));

  yield all([
    fork(handleLockDownEvent),
    fork(handleFortifiedEvent),
    fork(handleSingleTerminalDestroyed),
    fork(handleTerminalsDestroyed),
    fork(handleHeroesWounded),
    fork(handleRoundEnd),
  ]);
}
