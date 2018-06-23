// @flow

import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {
  clearCustomUnitAI,
  OPTIONAL_DEPLOYMENT_DONE,
  optionalDeployment,
  setCustomUnitAI,
} from '../imperials';
import {
  getCurrentRound,
  MISSION_SPECIAL_SETUP,
  missionSpecialSetupDone,
  SET_MAP_STATE_ACTIVATED,
  setAttackTarget,
  setDeploymentPoint,
  setMapStateVisible,
  setMoveTarget,
  STATUS_PHASE_END_ROUND_EFFECTS,
  statusPhaseEndRoundEffectsDone,
} from '../mission';
import {getMissionThreat, missionSagaLoadDone} from '../app';
import {REFER_CAMPAIGN_GUIDE, TARGET_CLOSEST_REBEL} from './constants';
import {addToRoster} from '../rebels';
import {displayModal} from '../modal';
import getRandomItem from '../utils/getRandomItem';
import handleHeroesWounded from './sharedSagas/handleHeroesWounded';
import handleStatusPhaseBegin from './sharedSagas/handleStatusPhaseBegin';
import helperDeploy from './helpers/helperDeploy';
import helperEventModal from './helpers/helperEventModal';
import helperIncreaseThreat from './helpers/helperIncreaseThreat';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import type {StateType} from '../types';
import track from '../../lib/track';

// Constants

const TARGET_YELLOW_BARRICADES = 'the Yellow barricades';
const TARGET_GREEN_BARRICADE = 'the Green barricade';
const TARGET_RED_OR_DOOR = 'the closest reachable Red barricade or the door';

const DEPLOYMENT_POINT_GREEN_W = 'The west green deployment point';
const DEPLOYMENT_POINT_GREEN_E = 'The east green deployment point';
const DEPLOYMENT_POINT_YELLOW = 'The yellow deployment point';
const DEPLOYMENT_POINT_RED = 'The red deployment point';

const CUSTOM_AI_TUSKEN = [
  {
    command:
      '{ACTION}{ACTION} Perform a ranged attack using 2 blue dice, requiring 8 accuracy against the unwounded hero or Rebel ally that is most damaged. This attack gains {SURGE}: +2 Accuracy. No other abilities may be used.',
    condition: 'If there is a Rebel figure on an exterior space',
  },
];

// Types

export type CanyonRunStateType = {};

// State

const initialState = {};

export default (state: CanyonRunStateType = initialState, action: Object) => {
  switch (action.type) {
    default:
      return state;
  }
};

// Selectors

export const getCanyonRunGoalText = (state: StateType): string[] => {
  const missionThreat = state.app.missionThreat;
  let goals = [];

  goals = goals.concat([
    '{BOLD}Plans:{END}',
    'A hero can interact with the terminal ({TECH}) to obtain the plans.',
    '{BREAK}',
    '{BOLD}Door:{END}',
    `Locked. A figure can attack the door (Health: ${missionThreat}, Defense: 1 {BLOCK})`,
    '{BREAK}',
    '{BOLD}Mission Tokens (Barricades):{END}',
    'Impassible terrain except for Tusken Raiders.',
    '{BREAK}',
    'Yellow: A hero can interact (2 {TECH}) to discard both.',
    '{BREAK}',
    'Green: A hero can interact (2 {STRENGTH}) to discard.',
    '{BREAK}',
    'Red: A hero can interact to discard the token, then test {INSIGHT}. If fail, suffer 2 {DAMAGE} and become Bleeding.',
    '{BREAK}',
    '{BOLD}R2-D2/C-3PO:{END}',
    'When defending, if they are not within 4 spaces of a hero, remove 1 die from their defense pool.',
  ]);

  return goals;
};

// Sagas

function getRandomDeploymentPoint() {
  return getRandomItem(DEPLOYMENT_POINT_GREEN_W, DEPLOYMENT_POINT_GREEN_E);
}

function* handleIncreaseDefenses(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if ([1, 2].includes(id) && type === 'imperial' && value === true) {
      track('canyonRun', 'increaseDefenses', 'triggered');

      // Both are discarded
      yield put(setMapStateVisible(1, 'imperial', false));
      yield put(setMapStateVisible(2, 'imperial', false));

      yield call(helperIncreaseThreat, 1);
      yield call(helperEventModal, {
        text: ['The threat has been increased by the threat level.'],
        title: 'Increase Defenses',
      });

      yield put(setDeploymentPoint(DEPLOYMENT_POINT_YELLOW));
      yield put(setMoveTarget(TARGET_GREEN_BARRICADE));

      // We're done
      break;
    }
  }
}

function* handleGreenBarricade(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 3 && type === 'imperial' && value === true) {
      yield put(setMapStateVisible(3, 'imperial', false));
      yield put(setMoveTarget(TARGET_RED_OR_DOOR));

      // We're done
      break;
    }
  }
}

function* handleTheyreComingThrough(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if ([4, 5].includes(id) && type === 'imperial' && value === true) {
      track('canyonRun', 'theyreComingThrough', 'triggered');

      yield call(
        helperDeploy,
        "They're Coming Through",
        REFER_CAMPAIGN_GUIDE,
        ['{ELITE}Kayn Somos{END} will now be deployed.'],
        ['kaynSomos', 'Deploy to the red point.']
      );

      yield put(setMapStateVisible(id, 'imperial', false));
      yield put(setDeploymentPoint(DEPLOYMENT_POINT_RED));

      // Undo Tusken custom AI since the rebels are so close
      yield put(clearCustomUnitAI('tuskenRaider'));
      yield put(clearCustomUnitAI('tuskenRaiderElite'));

      // We're done
      break;
    }
  }
}

function* handleMissionEnd(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'terminal' && value === true) {
      yield put(displayModal('REBEL_VICTORY'));
      track('canyonRun', 'victory', 'plans');
      // We're done
      break;
    }
  }
}

// REQUIRED SAGA
function* handleRoundEnd(): Generator<*, *, *> {
  while (true) {
    yield take(STATUS_PHASE_END_ROUND_EFFECTS);
    const currentRound = yield select(getCurrentRound);

    if (currentRound === 4) {
      yield call(helperEventModal, {
        story: 'The unrelentless sun bears down on you...',
        text: ['Each hero tests {STRENGTH}. Each hero who fails is Weakened.'],
        title: 'Heat of the Suns',
      });
    } else if (currentRound === 8) {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      track('canyonRun', 'defeat', 'round');
      break;
    }

    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(helperInitialSetup, [
    'heavyStormtrooper',
    'probeDroid',
    'tuskenRaider',
    'tuskenRaiderElite',
  ]);
  yield call(helperEventModal, {
    text: [
      'The heroes control {ELITE}R2-D2{END} and {ELITE}C-3PO{END} as allies at no cost.',
      'The threat has been increased.',
      'An optional deployment will now be done.',
    ],
    title: 'Initial Setup',
  });

  // Double current threat
  yield call(helperIncreaseThreat, 2);
  // Do optional deployment
  yield put(optionalDeployment());
  yield take(OPTIONAL_DEPLOYMENT_DONE);
  // Add R2-D2 & C-3PO
  yield put(addToRoster('r2d2'));
  yield put(addToRoster('c3p0'));

  const missionThreat = yield select(getMissionThreat);

  yield call(helperMissionBriefing, [
    'When {ELITE}R2-D2{END} or {ELITE}C-3PO{END} are defending, if they are not within 4 spaces of a hero, remove 1 die from their defense pool.',
    'Imperial mission tokens are barricades and are impassable terrain, except for Tusken Raiders. Based on the color:',
    'Yellow: A hero can interact (2 {TECH}) to discard both tokens.',
    'Green: A hero can interact (2 {STRENGTH}) to discard the token.',
    'Red: A hero can interact to discard the token, then test {INSIGHT}. If they fail, they suffer 2 {DAMAGE} and becomes Bleeding.',
    `The door is locked. A figure can attack the door (Health: ${missionThreat}, Defense: 1 {BLOCK})`,
    'A hero can interact with the terminal ({TECH}) to obtain the plans.',
  ]);

  yield put(missionSpecialSetupDone());
}

export function* canyonRun(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_CLOSEST_REBEL));
  yield put(setMoveTarget(TARGET_YELLOW_BARRICADES));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(getRandomDeploymentPoint()));

  yield put(setCustomUnitAI('tuskenRaider', CUSTOM_AI_TUSKEN));
  yield put(setCustomUnitAI('tuskenRaiderElite', CUSTOM_AI_TUSKEN));

  yield all([
    fork(handleSpecialSetup),
    fork(handleIncreaseDefenses),
    fork(handleGreenBarricade),
    fork(handleTheyreComingThrough),
    fork(handleMissionEnd),
    fork(handleHeroesWounded('canyonRun', 'CANYON_RUN_PRIORITY_TARGET_KILL_HERO', 'r2d2', 'c3p0')),
    fork(handleStatusPhaseBegin),
    fork(handleRoundEnd),
  ]);

  track('missionStart', 'canyonRun');
  yield put(missionSagaLoadDone());
}
