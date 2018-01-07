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
  setMapStateVisible,
  setMoveTarget,
  STATUS_PHASE_BEGIN,
  STATUS_PHASE_END_ROUND_EFFECTS,
  statusPhaseBeginDone,
  statusPhaseEndRoundEffectsDone,
  updateRebelVictory,
} from '../mission';
import {OPTIONAL_DEPLOYMENT_DONE, optionalDeployment} from '../imperials';
import {REFER_CAMPAIGN_GUIDE, TARGET_HERO_CLOSEST_UNWOUNDED, TARGET_REMAINING} from './constants';
import createAction from '../createAction';
import {displayModal} from '../modal';
import helperEventModal from './helpers/helperEventModal';
import helperIncreaseThreat from './helpers/helperIncreaseThreat';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import {missionSagaLoadDone} from '../app';
import type {StateType} from '../types';
import track from '../../lib/track';

// Constants

const TARGET_TERMINAL_PILOT = 'the terminal or pilot (whichever closest)';
const TARGET_HERO_PILOT = 'the hero escorting the pilot';
const TARGET_ESCAPE_HATCH = 'the escape hatch';

const DEPLOYMENT_POINT_GREEN_SW = 'The south west green deployment point';

// Types

export type ImpoundedStateType = {
  prepForTakeoffDone: boolean,
  priorityTargetKillHero: boolean,
};

// State

const initialState = {
  prepForTakeoffDone: false,
  priorityTargetKillHero: false,
};

export default (state: ImpoundedStateType = initialState, action: Object) => {
  switch (action.type) {
    case 'IMPOUNDED_SET_PREP_FOR_TAKEOFF':
      return {
        ...state,
        prepForTakeoffDone: true,
      };
    case 'IMPOUNDED_PRIORITY_TARGET_KILL_HERO':
      return {
        ...state,
        priorityTargetKillHero: action.payload,
      };
    default:
      return state;
  }
};

// Selectors

const getState = (state: StateType) => state.impounded;
export const getImpoundedGoalText = (state: StateType): string[] => {
  let goals = [];

  if (!state.impounded.prepForTakeoffDone) {
    goals = goals.concat([
      '{BOLD}Current Goal:{END}',
      'Deactivate the docking clamp controls (terminal) and retrieve the pilot.',
      '{BREAK}',
      '{BOLD}Docking clamp controls:{END}',
      'Interact and test {TECH} or {INSIGHT} to discard.',
      '{BREAK}',
      '{BOLD}Rebel mission token (Pilot):{END}',
      'A hero can interact with the pilot to retrieve the pilot.',
      'Hero gets -1 Speed and -1 {BLOCK}.',
    ]);
  } else {
    goals = goals.concat([
      '{BOLD}Escape Hatch:{END}',
      'Interact with the hero carrying the pilot to depart.',
      '{BREAK}',
      '{BOLD}Hero escorting pilot:{END}',
      'Hero gets -1 Speed and -1 {BLOCK}.',
    ]);
  }

  return goals;
};

// Sagas

function* handlePrepForTakeoffEvent(): Generator<*, *, *> {
  while (true) {
    yield take(SET_MAP_STATE_ACTIVATED);
    const mapStates = yield select(getMapStates);
    // Now check all 4 terminals, if they are activated, then game over for rebels
    if (mapStates['terminal-1'].activated && mapStates['rebel-1'].activated) {
      track('impounded', 'prepForTakeoff', 'triggered');
      yield call(helperEventModal, {
        story: REFER_CAMPAIGN_GUIDE,
        text: ['The threat has been increased.', 'An optional deployment will now be done.'],
        title: 'Prep for Takeoff',
      });
      // Double current threat
      yield call(helperIncreaseThreat, 1);
      // Do optional deployment
      yield put(optionalDeployment());
      yield take(OPTIONAL_DEPLOYMENT_DONE);
      yield call(helperEventModal, {
        text: [
          'Place a green neutral token on the blue point as indicated on the mission map in the campaign guide.',
          'That point represents the hatch. A hero carrying the pilot can interact with the hatch for the pilot to depart.',
        ],
        title: 'Prep for Takeoff',
      });
      yield put(setMapStateVisible(1, 'neutral', true));
      yield put(createAction('IMPOUNDED_SET_PREP_FOR_TAKEOFF', true));
      yield put(updateRebelVictory('The pilot departs'));

      // Change targets
      const {priorityTargetKillHero} = yield select(getState);
      if (!priorityTargetKillHero) {
        yield put(setAttackTarget(TARGET_HERO_PILOT));
        yield put(setMoveTarget(TARGET_ESCAPE_HATCH));
      }
      // We're done
      break;
    }
  }
}

function* handlePilotDeparts(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'neutral' && value === true) {
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
      track('impounded', 'defeat', 'wounded');
      break;
    }
    const isOneHeroLeft = yield select(getIsOneHeroLeft);
    if (isOneHeroLeft) {
      // SWITCH TARGET
      yield put(createAction('IMPOUNDED_PRIORITY_TARGET_KILL_HERO', true));
      yield put(setAttackTarget(TARGET_REMAINING));
      yield put(setMoveTarget(TARGET_REMAINING));
    }
  }
}

// REQUIRED SAGA
function* handleStatusPhaseBegin(): Generator<*, *, *> {
  while (true) {
    yield take(STATUS_PHASE_BEGIN);
    yield put(statusPhaseBeginDone());
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
      track('impounded', 'defeat', 'round');
      // We're done
      break;
    }

    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(
    helperInitialSetup,
    '{ELITE}Imperial Officer{END}, Nexu, {ELITE}Nexu{END}, Royal Guard'
  );
  yield call(helperEventModal, {
    text: ['The threat has been increased.', 'An optional deployment will now be done.'],
    title: 'Initial Setup',
  });
  // Double current threat
  yield call(helperIncreaseThreat, 2);
  // Do optional deployment
  yield put(optionalDeployment());
  yield take(OPTIONAL_DEPLOYMENT_DONE);

  yield call(helperMissionBriefing, [
    'The terminal represents the docking clamp.',
    'A hero can interact with the terminal ({TECH} or {INSIGHT}) to deactivate and discard it.',
    'The Rebel mission token is the pilot. A hero can retrieve the pilot. The hero carrying the pilot gets -1 Speed and -1 {BLOCK}.',
  ]);
  yield put(missionSpecialSetupDone());
}

/*
Priority target definitions:
1) Initial attack is default, move is terminal or pilot, whichever is closer
2) Once terminal and pilot retrieved, attack is hero escorting pilot and move is escape hatch
3) At any point if heroes - 1 are wounded, attack and move are the last remaining hero
*/
export function* impounded(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
  yield put(setMoveTarget(TARGET_TERMINAL_PILOT));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN_SW));

  yield all([
    fork(handleSpecialSetup),
    fork(handlePrepForTakeoffEvent),
    fork(handlePilotDeparts),
    fork(handleHeroesWounded),
    fork(handleStatusPhaseBegin),
    fork(handleRoundEnd),
  ]);

  track('missionStart', 'impounded');
  yield put(missionSagaLoadDone());
}
