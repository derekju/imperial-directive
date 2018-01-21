// @flow

import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {getAreAllHeroesWounded, getIsOneHeroLeft, WOUND_REBEL_HERO} from '../rebels';
import {
  MISSION_SPECIAL_SETUP,
  missionSpecialSetupDone,
  SET_MAP_STATE_ACTIVATED,
  setAttackTarget,
  setDeploymentPoint,
  setMapStateActivated,
  setMapStateInteractable,
  setMapStateVisible,
  setMoveTarget,
  STATUS_PHASE_END_ROUND_EFFECTS,
  statusPhaseEndRoundEffectsDone,
} from '../mission';
import {REFER_CAMPAIGN_GUIDE, TARGET_HERO_CLOSEST_UNWOUNDED, TARGET_REMAINING} from './constants';
import createAction from '../createAction';
import {displayModal} from '../modal';
import handleStatusPhaseBegin from './sharedSagas/handleStatusPhaseBegin';
import helperChoiceModal from './helpers/helperChoiceModal';
import helperEventModal from './helpers/helperEventModal';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import {missionSagaLoadDone} from '../app';
import type {StateType} from '../types';
import track from '../../lib/track';

// Constants

const TARGET_NEUTRAL = 'the neutral token';
const TARGET_RED_TERMINAL = 'the red terminal';
const TARGET_RED_TOKEN = 'the closest red Rebel mission token';
const TARGET_YELLOW_TERMINAL = 'the closest yellow terminal';
const TARGET_YELLOW_TOKEN = 'the closest yellow Rebel mission token';

const DEPLOYMENT_POINT_GREEN_E = 'The green deployment point in the east';
const DEPLOYMENT_POINT_GREEN_MOST_HEROES =
  'The western green deployment point closest to the most heroes';

// Types

export type CapturedStateType = {
  equipmentRetrieved: boolean,
  priorityTargetKillHero: boolean,
};

// State

const initialState = {
  equipmentRetrieved: false,
  priorityTargetKillHero: false,
};

export default (state: CapturedStateType = initialState, action: Object) => {
  switch (action.type) {
    case 'CAPTURED_EQUIPMENT_RETRIEVED':
      return {
        ...state,
        equipmentRetrieved: true,
      };
    case 'CAPTURED_PRIORITY_TARGET_KILL_HERO':
      return {
        ...state,
        priorityTargetKillHero: action.payload,
      };
    default:
      return state;
  }
};

// Selectors

const getState = (state: StateType) => state.captured;
export const getCapturedGoalText = (state: StateType): string[] => {
  if (!state.captured.equipmentRetrieved) {
    return [
      '{BOLD}Current Goal:{END}',
      "Retrieve all heroes' equipment by interacting with N1.",
      '{BREAK}',
      '{BOLD}Hero with no weapon:{END}',
      'Attack an adjacent target with 1 green and 1 yellow die.{BREAK}Before attacking, test {STRENGTH}. If pass, gain {SURGE}: +2 {DAMAGE}.',
      '{BREAK}',
      '{BOLD}Withdrawn hero:{END}',
      'Withdrawn heroes receive only 1 action and they can only move.',
      '{BREAK}',
      '{BOLD}Doors:{END}',
      'Hallway and Storage Room doors are locked to Rebels. Imperials can move and attack through them.',
    ];
  } else {
    return [
      '{BOLD}Mission Tokens:{END}',
      'Imperial tokens are closed passageways. Rebel tokens are open passageways.',
      '{BREAK}',
      'A hero can interact ({INSIGHT} or {TECH}) with a terminal to change all tokens of that color to Rebel tokens of that color.',
      '{BREAK}',
      '{BOLD}Red Rebel Token:{END}',
      'Interact with a red Rebel token to place the figure in any space in the Trash Compactor.',
      '{BREAK}',
      '{BOLD}Departing:{END}',
      'All heroes must be on or adjacent to the yellow Rebel mission tokens in order to depart!',
      '{BREAK}',
      '{BOLD}Withdrawn hero:{END}',
      'Withdrawn heroes receive only 1 action and they can only move.',
      '{BREAK}',
      '{BOLD}Doors:{END}',
      'Hallway and Storage Room doors are locked to Rebels. Imperials can move and attack through them.',
    ];
  }
};

// Sagas

function* handleEquipmentRetrieval(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'neutral' && value === true) {
      // Need to ask if this is the last hero to get their equipment
      const answer = yield call(
        helperChoiceModal,
        'Is this the last Hero to retrieve their equipment?',
        'Equipment Retrieval'
      );
      if (answer === 'yes') {
        yield call(handleEquipmentRetrieved);
        break;
      } else {
        // Re-enable the neutral token again
        yield put(setMapStateActivated(1, 'neutral', false));
      }
    }
  }
}

function* handleEquipmentRetrieved(): Generator<*, *, *> {
  yield call(helperEventModal, {
    story: REFER_CAMPAIGN_GUIDE,
    text: [
      'Imperial mission tokens (I-1, I-2, I-3, I-4) are closed passageways. Rebel mission tokens are open passageways.',
      'A hero can interact ({INSIGHT} or {TECH}) with a terminal to flip all Imperial tokens of that color to Rebel tokens of that color.',
      'A figure can interact with a red Rebel mission token to place his token in any empty space in the Trash Compactor.',
      'All heroes must be on or adjacent to the yellow Rebel mission tokens in order to depart!',
    ],
    title: 'Assault',
  });
  yield put(setMapStateInteractable(1, 'terminal', true));
  yield put(createAction('CAPTURED_EQUIPMENT_RETRIEVED', true));
  // SWITCH TARGETS
  const {priorityTargetKillHero} = yield select(getState);
  if (!priorityTargetKillHero) {
    yield put(setMoveTarget(TARGET_RED_TERMINAL));
  }
}

function* handleRedTokensFlipped(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'terminal' && value === true) {
      yield call(helperEventModal, {
        story: 'With a groan the gate for the passageway to the Trash Compactor opens.',
        text: ['Replace the red Imperial mission tokens with red Rebel mission tokens.'],
        title: 'Escape',
      });

      // Change all red imperial tokens to red rebel tokens
      yield put(setMapStateVisible(1, 'imperial', false));
      yield put(setMapStateVisible(2, 'imperial', false));
      yield put(setMapStateVisible(1, 'rebel', true));
      yield put(setMapStateVisible(2, 'rebel', true));

      // SWITCH TARGETS
      const {priorityTargetKillHero} = yield select(getState);
      if (!priorityTargetKillHero) {
        yield put(setMoveTarget(TARGET_RED_TOKEN));
      }

      // We're done
      break;
    }
  }
}

function* handleYellowTokensFlipped(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if ([2, 3].includes(id) && type === 'terminal' && value === true) {
      yield call(helperEventModal, {
        story: 'With a groan the escape hatch in the Trash Compactor opens.',
        text: ['Replace the yellow Imperial mission tokens with yellow Rebel mission tokens.'],
        title: 'Escape',
      });

      // Change all yellow imperial tokens to yellow rebel tokens
      yield put(setMapStateVisible(3, 'imperial', false));
      yield put(setMapStateVisible(4, 'imperial', false));
      yield put(setMapStateVisible(3, 'rebel', true));
      yield put(setMapStateVisible(4, 'rebel', true));
      // Open the locked doors
      yield put(setMapStateActivated(2, 'door', true));
      yield put(setMapStateActivated(3, 'door', true));
      // SWITCH TARGETS
      const {priorityTargetKillHero} = yield select(getState);
      if (!priorityTargetKillHero) {
        yield put(setMoveTarget(TARGET_YELLOW_TOKEN));
      }
      // We're done
      break;
    }
  }
}

function* handleRedRebelTokenInteracted(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if ([1, 2].includes(id) && type === 'rebel' && value === true) {
      yield call(helperEventModal, {
        story:
          'You stealthily move through the passageway and find yourself in the facility Trash Compactor.',
        text: ['Move the figure into an open space in the Trash Compactor.'],
        title: 'Escape',
      });

      // SWITCH TARGETS
      const {priorityTargetKillHero} = yield select(getState);
      if (!priorityTargetKillHero) {
        yield put(setMoveTarget(TARGET_YELLOW_TERMINAL));
      }
      // Switch deployment to the western part of the map once a hero warps
      yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN_MOST_HEROES));

      // We're done
      break;
    }
  }
}

function* handleYellowRebelTokenInteracted(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if ([3, 4].includes(id) && type === 'rebel' && value === true) {
      yield put(displayModal('REBEL_VICTORY'));
      track('captured', 'victory', 'escaped');
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
      track('captured', 'defeat', 'wounded');
      break;
    }
    const isOneHeroLeft = yield select(getIsOneHeroLeft);
    if (isOneHeroLeft) {
      // PRIORITY TARGET SWITCH #4
      yield put(createAction('CAPTURED_PRIORITY_TARGET_KILL_HERO', true));
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
  yield call(
    helperInitialSetup,
    'Imperial Officer, {ELITE}Elite Imperial Officer{END}, Stormtrooper, {ELITE}Elite Stormtrooper{END}'
  );
  yield call(helperMissionBriefing, [
    'Heroes cannot bring allies!',
    'All Hero Item cards are flipped facedown and are unusable.{BREAK}A hero can interact with the neutral mission token (N1) to flip his/her items faceup.',
    'When a hero withdraws, he is incapacitated instead. The hero receives only 1 activation and can only move.',
    'A hero without a weapon can attack an adjacent target with 1 green and 1 yellow die.{BREAK}Before attacking, test {STRENGTH}. If you pass, the attack gains {SURGE}: +2 {DAMAGE}.',
    'The doors in the Storage Room and Hallway are locked. Imperial figures may move and fire past them.',
  ]);
  yield put(missionSpecialSetupDone());
}

/*
Priority target definitions:
1) Initial attack is unwounded hero, move is the neutral token
2) Once equipment retrieved, move is the red terminal
3) Once the terminal is accessed, move is closest red Rebel token
4) Once hero goes into trash room, move is a yellow terminal
5) Once yellow terminal accessed, move is the yellow Rebel tokens
6) At any point if heroes - 1 are wounded, attack and move are the last remaining hero
*/
export function* captured(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
  yield put(setMoveTarget(TARGET_NEUTRAL));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN_E));

  yield all([
    fork(handleSpecialSetup),
    fork(handleEquipmentRetrieval),
    fork(handleRedTokensFlipped),
    fork(handleYellowTokensFlipped),
    fork(handleRedRebelTokenInteracted),
    fork(handleYellowRebelTokenInteracted),
    fork(handleHeroesWounded),
    fork(handleStatusPhaseBegin),
    fork(handleRoundEnd),
  ]);

  track('missionStart', 'captured');
  yield put(missionSagaLoadDone());
}
