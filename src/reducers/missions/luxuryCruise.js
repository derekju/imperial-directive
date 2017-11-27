// @flow

import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {
  getAreAllHeroesWounded,
  getIsOneHeroLeft,
  WOUND_REBEL_HERO,
} from '../rebels';
import {
  getCurrentRound,
  MISSION_SPECIAL_SETUP,
  missionSpecialSetupDone,
  SET_MAP_STATE_ACTIVATED,
  setAttackTarget,
  setDeploymentPoint,
  setMoveTarget,
  statusPhaseEndRoundEffectsDone,
  STATUS_PHASE_END_ROUND_EFFECTS,
} from '../mission';
import {displayModal} from '../modal';
import {deployNewGroups, OPTIONAL_DEPLOYMENT_DONE, optionalDeployment} from '../imperials';
import helperIncreaseThreat from './helpers/helperIncreaseThreat';
import waitForModal from '../../sagas/waitForModal';

// Constants

const TARGET_HERO_CLOSE_TERMINAL = 'the closest hero adjacent to a terminal';
const TARGET_NEAREST_TERMINAL = 'the nearest active terminal';
const TARGET_REMAINING = 'the remaining hero';

const DEPLOYMENT_POINT_GREEN_TERMINAL = 'The green deployment point';

// Local state

let securedTerminals = [];

// Sagas

function* handleTerminalInteraction(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (type === 'terminal' && value === true && !securedTerminals.includes(id)) {
      securedTerminals.push(id);

      // Check if rebels won
      if (securedTerminals.length === 5) {
        yield put(displayModal('REBEL_VICTORY'));
        // We're done
        break;
      } else {
        yield put(
          displayModal('RESOLVE_EVENT', {
            text: [
              'Resolve the Desperation event.',
              'Threat has been increased.',
            ],
          })
        );
        yield call(waitForModal('RESOLVE_EVENT'));
        yield call(helperIncreaseThreat, 1);
      }
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
      // PRIORITY TARGET SWITCH
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

    // Display a modal to remind player to check terminal status
    yield put(
      displayModal('RESOLVE_EVENT', {
        text: [
          'If 1 or more Rebel figures are the only figures adjacent to a terminal, it is secured.',
          'Manually activate the terminal when the next round begins.',
        ],
      })
    );
    yield call(waitForModal('RESOLVE_EVENT'));

    // Sound the Alarm event
    yield put(
      displayModal('RESOLVE_EVENT', {
        text: [
          'Resolve the Sound the Alarm event.',
          'If there are rebel figures behind any open doors with Imperial figures in the same room, choose option 1 to close a door to that room.',
          'Otherwise, choose option 2. If not possible, choose option 1 and close any door.'
        ],
      })
    );
    yield call(waitForModal('RESOLVE_EVENT'));

    // Secure the Ship event
    if (currentRound === 2) {
      // Display a modal saying we're going to deploy
      yield put(
        displayModal('RESOLVE_EVENT', {
          text: [
            'Resolve the Secure the Ship event.'
          ],
        })
      );
      yield call(waitForModal('RESOLVE_EVENT'));
      // Do the deployment from reserved groups
      yield put(deployNewGroups(['royalGuard']));
    }

    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  // Double current threat
  yield call(helperIncreaseThreat, 2);
  // Do optional deployment
  yield put(optionalDeployment());
  yield take(OPTIONAL_DEPLOYMENT_DONE);
  yield put(missionSpecialSetupDone());
}

/*
Priority target definitions:
1) Attack is the hero closest to a terminal, move is the nearest active terminal
2) At any point if heroes - 1 are wounded, attack and move are the last remaining hero
*/
export function* luxuryCruise(): Generator<*, *, *> {
  // SET TARGET
  yield put(setAttackTarget(TARGET_HERO_CLOSE_TERMINAL));
  yield put(setMoveTarget(TARGET_NEAREST_TERMINAL));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN_TERMINAL));

  yield all([
    fork(handleSpecialSetup),
    fork(handleTerminalInteraction),
    // fork(handleSoundTheAlarmEvent),
    // fork(handleDesperationEvent),
    // fork(handleSoundTheAlarmsEvent),
    // fork(handleHeroEscapes),
    fork(handleHeroesWounded),
    fork(handleRoundEnd),
  ]);
}
