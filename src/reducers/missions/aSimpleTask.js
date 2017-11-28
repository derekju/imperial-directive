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
  setAttackTarget,
  setDeploymentPoint,
  setMapStateActivated,
  setMoveTarget,
  statusPhaseEndRoundEffectsDone,
  STATUS_PHASE_END_ROUND_EFFECTS,
} from '../mission';
import {displayModal} from '../modal';
import {OPTIONAL_DEPLOYMENT_DONE, optionalDeployment} from '../imperials';
import {REFER_CAMPAIGN_GUIDE, TARGET_HERO_CLOSEST_UNWOUNDED, TARGET_REMAINING} from './constants';
import helperDeploy from './helpers/helperDeploy';
import helperIncreaseThreat from './helpers/helperIncreaseThreat';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import {missionSagaLoadDone} from '../app';
import waitForModal from '../../sagas/waitForModal';

// Constants

const TARGET_TERMINAL_1 = 'terminal 1';
const TARGET_TERMINAL_2 = 'terminal 2';
const TARGET_NEUTRAL = 'the formula';
const TARGET_HERO_FORMULA = 'the hero carrying the formula (or closest hero)';
const TARGET_ENTRANCE = 'the entrance';

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
          yield put(setMoveTarget(TARGET_ENTRANCE));
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
      yield call(
        helperDeploy,
        REFER_CAMPAIGN_GUIDE,
        [
          'Deploy an Imperial Officer and Stormtrooper group to the Command Room.',
          'The units should be deployed next to door 2.',
        ],
        'Lightly Guarded',
        ['stormtrooper', 'imperialOfficer']
      );
      // Change target
      if (!priorityTargetKillHero) {
        yield put(setMoveTarget(TARGET_TERMINAL_2));
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
          story: REFER_CAMPAIGN_GUIDE,
          text: [''],
          title: 'Too Quiet',
        })
      );
      yield call(waitForModal('RESOLVE_EVENT'));
      // Change target
      if (!priorityTargetKillHero) {
        yield put(setMoveTarget(TARGET_NEUTRAL));
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
          story: REFER_CAMPAIGN_GUIDE,
          text: ['All doors are now closed and the threat has been raised.'],
          title: 'Sound the Alarms',
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
        yield put(setAttackTarget(TARGET_HERO_FORMULA));
        yield put(setMoveTarget(TARGET_HERO_FORMULA));
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
      yield put(setAttackTarget(TARGET_REMAINING));
      yield put(setMoveTarget(TARGET_REMAINING));
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
  yield call(helperInitialSetup, 'Stormtrooper, {ELITE}Elite Trandoshan Hunter{END}');
  // Double current threat
  yield call(helperIncreaseThreat, 2);
  // Do optional deployment
  yield put(optionalDeployment());
  yield take(OPTIONAL_DEPLOYMENT_DONE);
  yield call(helperMissionBriefing, [
    'Doors are locked. A Rebel figure can interact with a terminal ({STRENGTH} or {TECH}) to open the nearest door.',
    'A hero can investigate the neutral token to collect the formula.',
    'A hero carrying the formula can escape through the entrance.',
  ]);
  yield put(missionSpecialSetupDone());
}

/*
Priority target definitions:
1) Initial attack is default, move is terminal 1
2) Once door 1 opens, move is terminal 2
3) Once door 2 opens, move is neutral
4) Once formula is taken, attack and move are the hero carrying the formula
5) If door 1 reopens, move target is the entrance to defend it
6) At any point if heroes - 1 are wounded, attack and move are the last remaining hero
*/
export function* aSimpleTask(): Generator<*, *, *> {
  // SET TARGET
  yield put(setAttackTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
  yield put(setMoveTarget(TARGET_TERMINAL_1));
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

  yield put(missionSagaLoadDone());
}
