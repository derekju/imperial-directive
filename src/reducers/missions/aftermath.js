// @flow

import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {getAreAllHeroesWounded, WOUND_REBEL_HERO} from '../rebels';
import {
  getCurrentRound,
  getMapStates,
  SET_MAP_STATE_ACTIVATED,
  statusPhaseEndRoundEffectsDone,
  STATUS_PHASE_END_ROUND_EFFECTS,
} from '../mission';
import {displayModal} from '../modal';
import {deployNewGroups} from '../imperials';
import waitForModal from '../../sagas/waitForModal';

// Local state

let requireEndRoundEffects = false;

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

export function* aftermath(): Generator<*, *, *> {
  yield all([
    fork(handleLockDownEvent),
    fork(handleFortifiedEvent),
    fork(handleTerminalsDestroyed),
    fork(handleHeroesWounded),
    fork(handleRoundEnd),
  ]);
}
