// @flow

import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {getAreAllHeroesWounded, getIsOneHeroLeft, WOUND_REBEL_HERO} from '../rebels';
import {
  getCurrentRound,
  MISSION_SPECIAL_SETUP,
  missionSpecialSetupDone,
  SET_MAP_STATE_ACTIVATED,
  setAttackTarget,
  setDeploymentPoint,
  setMapStateVisible,
  setMoveTarget,
  statusPhaseEndRoundEffectsDone,
  STATUS_PHASE_END_ROUND_EFFECTS,
} from '../mission';
import {OPTIONAL_DEPLOYMENT_DONE, optionalDeployment} from '../imperials';
import {REFER_CAMPAIGN_GUIDE, TARGET_REMAINING} from './constants';
import {displayModal} from '../modal';
import helperDeploy from './helpers/helperDeploy';
import helperIncreaseThreat from './helpers/helperIncreaseThreat';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import {missionSagaLoadDone} from '../app';
import type {StateType} from '../types';
import waitForModal from '../../sagas/waitForModal';

// Constants

const TARGET_HERO_CLOSE_TERMINAL = 'the closest hero adjacent to a terminal';
const TARGET_NEAREST_TERMINAL = 'the nearest active terminal';

const DEPLOYMENT_POINT_GREEN_TERMINAL = 'The green deployment point';

// Local state

let securedTerminals = [];

// Selectors

export const getLuxuryCruiseGoalText = (state: StateType): string[] => {
  const goals = [
    '{BOLD}Doors:{END}',
    `Test {STRENGTH} or {TECH} to open.`,
    '{BREAK}',
    '{BOLD}Securing Terminals:{END}',
    'A terminal is secured if only Rebel figures are adjacent to it at the end of a round.',
  ];

  return goals;
};

// Sagas

function* handleTerminalInteraction(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (type === 'terminal' && value === true && !securedTerminals.includes(id)) {
      yield put(setMapStateVisible(id, 'terminal', false));
      securedTerminals.push(id);

      // Check if rebels won
      if (securedTerminals.length === 5) {
        yield put(displayModal('REBEL_VICTORY'));
        // We're done
        break;
      } else {
        yield put(
          displayModal('RESOLVE_EVENT', {
            story: 'The imperial troops are gathering their forces...',
            text: ['The current threat has been increased.'],
            title: 'Desperation',
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
        story: 'The terminals were the first step in taking over the ship.',
        text: [
          'If 1 or more Rebel figures are the only figures adjacent to a terminal, it is secured.',
          'Manually secure the terminal when the next round begins.',
        ],
        title: 'Securing Terminals',
      })
    );
    yield call(waitForModal('RESOLVE_EVENT'));

    // Sound the Alarm event
    yield put(
      displayModal('RESOLVE_EVENT', {
        story: 'The imperial troops are aware of your presence!',
        text: [
          'If there are rebel figures behind any open doors with Imperial figures in the same room, manually close the door to that room.',
          'Otherwise, perform a standard attack against an unwounded hero.',
        ],
        title: 'Sound the Alarm',
      })
    );
    yield call(waitForModal('RESOLVE_EVENT'));

    // Secure the Ship event
    if (currentRound === 2) {
      yield call(
        helperDeploy,
        REFER_CAMPAIGN_GUIDE,
        ['Resolve the Secure the Ship event.'],
        'Secure the Ship',
        ['royalGuard']
      );
    }

    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(
    helperInitialSetup,
    'Imperial Officer, Probe Droid, Stormtrooper, {ELITE}Elite Stormtrooper{END}'
  );
  // Double current threat
  yield call(helperIncreaseThreat, 2);
  // Do optional deployment
  yield put(optionalDeployment());
  yield take(OPTIONAL_DEPLOYMENT_DONE);
  yield call(helperMissionBriefing, [
    'Doors are locked to heroes. A hero can interact with a door ({STRENGTH} or {TECH}) to open it.',
    'A terminal is secured if only Rebel figures are adjacent to it at the end of a round.',
  ]);
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
    fork(handleHeroesWounded),
    fork(handleRoundEnd),
  ]);

  yield put(missionSagaLoadDone());
}
