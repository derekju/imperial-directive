// @flow

import {all, call, cancel, fork, put, select, take} from 'redux-saga/effects';
import {enableEscape, SET_REBEL_ESCAPED} from '../rebels';
import {
  getCurrentRound,
  MISSION_SPECIAL_SETUP,
  missionSpecialSetupDone,
  SET_MAP_STATE_ACTIVATED,
  setAttackTarget,
  setDeploymentPoint,
  setMapStateInteractable,
  setMapStateVisible,
  setMoveTarget,
  STATUS_PHASE_END_ROUND_EFFECTS,
  statusPhaseEndRoundEffectsDone,
  updateRebelVictory,
} from '../mission';
import {OPTIONAL_DEPLOYMENT_DONE, optionalDeployment} from '../imperials';
import {REFER_CAMPAIGN_GUIDE, TARGET_HERO_CLOSEST_UNWOUNDED} from './constants';
import createAction from '../createAction';
import {displayModal} from '../modal';
import handleHeroesWounded from './sharedSagas/handleHeroesWounded';
import handleStatusPhaseBegin from './sharedSagas/handleStatusPhaseBegin';
import helperDeploy from './helpers/helperDeploy';
import helperEventModal from './helpers/helperEventModal';
import helperIncreaseThreat from './helpers/helperIncreaseThreat';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import missions from '../../data/missions';
import {missionSagaLoadDone} from '../app';
import snakeCase from 'lodash/snakeCase';
import type {StateType} from '../types';
import track from '../../lib/track';

// Constants

const MISSION_NAME = 'forestAmbush';
const MISSION_NAME_S = snakeCase(MISSION_NAME).toUpperCase();

const TARGET_FALLEN_TREE = 'the fallen tree';
const TARGET_HIDDEN_SUPPLIES = 'the hidden supplies';
const TARGET_ENTRANCE = 'the entrance';
const TARGET_HERO_WITH_SUPPLIES = 'the hero with the hidden supplies';

const DEPLOYMENT_POINT_GREEN = 'The green deployment point';
const DEPLOYMENT_POINT_RED = 'The red deployment point';

// Types

export type ForestAmbushStateType = {
  campEntered: boolean,
  priorityTargetKillHero: boolean,
  supplyClaimed: boolean,
};

// State

const initialState = {
  campEntered: false,
  priorityTargetKillHero: false,
  supplyClaimed: false,
};

export default (state: ForestAmbushStateType = initialState, action: Object) => {
  switch (action.type) {
    case `${MISSION_NAME_S}_PRIORITY_TARGET_KILL_HERO`:
      return {
        ...state,
        priorityTargetKillHero: action.payload,
      };
    case 'FOREST_AMBUSH_CAMP_ENTERED':
      return {
        ...state,
        campEntered: true,
      };
    case 'FOREST_AMBUSH_SUPPLY_CLAIMED':
      return {
        ...state,
        supplyClaimed: true,
      };
    default:
      return state;
  }
};

// Selectors

// const getState = (state: StateType) => state[MISSION_NAME];
export const getForestAmbushGoalText = (state: StateType): string[] => {
  let goals = [];

  const {supplyClaimed} = state.forestAmbush;

  if (!supplyClaimed) {
    goals = goals.concat([
      '{BOLD}Current Goal:{END}',
      'Claim the hidden supplies (red Rebel token). Interact ({INSIGHT}) to claim.',
      '{BREAK}',
      '{BOLD}Fallen Tree:{END}',
      'Interact with neutral mission token (2 {STRENGTH}) to discard all.',
      '{BREAK}',
    ]);
  } else {
    goals = goals.concat([
      '{BOLD}Calling for Extract:{END}',
      'Interact with the terminal ({TECH}).',
      '{BREAK}',
      '{BOLD}Escaping:{END}',
      'After calling for extract, hero with hidden supplies can escape through entrance.',
      '{BREAK}',
    ]);
  }

  return goals;
};

// Sagas

function* handleFallenTree(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if ([1, 2, 3].includes(id) && type === 'neutral' && value === true) {
      yield call(helperEventModal, {
        text: ['The fallen tree has been discarded.'],
        title: 'Forest Ambush',
      });

      yield put(setMapStateVisible(1, 'neutral', false));
      yield put(setMapStateVisible(2, 'neutral', false));
      yield put(setMapStateVisible(3, 'neutral', false));

      yield put(setMoveTarget(TARGET_HIDDEN_SUPPLIES));

      // We're done
      break;
    }
  }
}

function* handleStrikeTeam(): Generator<*, *, *> {
  track(MISSION_NAME, 'strikeTeam', 'triggered');

  yield take('FOREST_AMBUSH_CAMP_ENTERED');
  yield call(
    helperDeploy,
    'Strike Team',
    REFER_CAMPAIGN_GUIDE,
    [
      'An {ELITE}Elite Imperial Officer{END}, {ELITE}Elite Probe Droid{END}, and {ELITE}General Weiss{END} will now be deployed.',
    ],
    ['imperialOfficerElite', 'Deploy to the red point.'],
    ['probeDroidElite', 'Deploy to the red point.'],
    ['generalWeiss', 'Deploy to the yellow point.']
  );
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_RED));
  yield put(setMapStateInteractable(1, 'rebel', true));
}

function* handleExtract(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'rebel' && value === true) {
      track(MISSION_NAME, 'extract', 'triggered');

      yield put(setMapStateVisible(1, 'rebel', false));
      yield put(setMapStateInteractable(1, 'terminal', true));
      yield put(createAction('FOREST_AMBUSH_SUPPLY_CLAIMED'));
      yield put(setAttackTarget(TARGET_HERO_WITH_SUPPLIES));
      yield put(setMoveTarget(TARGET_ENTRANCE));

      yield put(updateRebelVictory('Escape with the hidden supplies through the entrance'));

      yield call(helperEventModal, {
        text: [
          'A hero can interact with the terminal ({TECH}) to call for an extraction.',
          'After a hero has called for an extraction, a hero carrying the supplies can escape through the entrance.',
          'Once the Rebels call for an extraction, if that hero escapes, they win!',
        ],
        title: 'Extract',
      });

      // We're done
      break;
    }
  }
}

function* handleExtractCalled(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'terminal' && value === true) {
      yield put(enableEscape());

      yield call(helperEventModal, {
        text: ['The hero carrying the hidden supplies can now escape through the entrance.'],
        title: 'Extract Called',
      });

      // We're done
      break;
    }
  }
}

function* handleEscape(): Generator<*, *, *> {
  yield take(SET_REBEL_ESCAPED);
  // Just assume if someone escapes the rebels won
  // It's up to the player not to abuse the escape button
  yield put(displayModal('REBEL_VICTORY'));
  track(MISSION_NAME, 'victory', 'escaped');
  yield cancel();
}

// REQUIRED SAGA
function* handleRoundEnd(): Generator<*, *, *> {
  while (true) {
    yield take(STATUS_PHASE_END_ROUND_EFFECTS);
    const currentRound = yield select(getCurrentRound);

    if (currentRound === 5) {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      track(MISSION_NAME, 'defeat', 'round');
      break;
    }

    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(helperInitialSetup, missions[MISSION_NAME].initialGroups);
  yield call(helperEventModal, {
    text: [
      'The threat has been increased by twice the threat level.',
      'An optional deployment will now be done.',
    ],
    title: 'Initial Setup',
  });

  // Double current threat
  yield call(helperIncreaseThreat, 2);
  // Do optional deployment
  yield put(optionalDeployment());
  yield take(OPTIONAL_DEPLOYMENT_DONE);

  yield call(helperMissionBriefing, [
    'The neutral mission tokens represent a fallen tree and are blocking terrain. A hero can interact with one of the tokens (2 {STRENGTH}) to discard all of the tokens.',
    'The red Rebel mission token is the hidden supplies. A hero can interact with the supplies ({INSIGHT}) to claim them.',
  ]);

  yield put(missionSpecialSetupDone());
}

export function* forestAmbush(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
  yield put(setMoveTarget(TARGET_FALLEN_TREE));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN));

  yield all([
    fork(handleSpecialSetup),
    fork(handleFallenTree),
    fork(handleStrikeTeam),
    fork(handleExtract),
    fork(handleExtractCalled),
    fork(handleEscape),
    fork(handleHeroesWounded(MISSION_NAME, `${MISSION_NAME_S}_PRIORITY_TARGET_KILL_HERO`)),
    fork(handleStatusPhaseBegin),
    fork(handleRoundEnd),
  ]);

  track('missionStart', MISSION_NAME);
  yield put(missionSagaLoadDone());
}
