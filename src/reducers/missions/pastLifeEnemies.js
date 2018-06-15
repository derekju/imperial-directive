// @flow

import {addToRoster, getRoster, WOUND_REBEL_OTHER} from '../rebels';
import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {
  getCurrentRound,
  increaseThreat,
  MISSION_SPECIAL_SETUP,
  missionSpecialSetupDone,
  SET_MAP_STATE_ACTIVATED,
  setAttackTarget,
  setDeploymentPoint,
  setMapStateActivated,
  setMapStateInteractable,
  setMoveTarget,
  STATUS_PHASE_END_ROUND_EFFECTS,
  statusPhaseEndRoundEffectsDone,
  updateRebelVictory,
} from '../mission';
import {getMissionThreat, missionSagaLoadDone} from '../app';
import {OPTIONAL_DEPLOYMENT_DONE, optionalDeployment, setImperialUnitHpBuff} from '../imperials';
import createAction from '../createAction';
import {displayModal} from '../modal';
import getRandomItem from '../utils/getRandomItem';
import handleHeroesWounded from './sharedSagas/handleHeroesWounded';
import handleImperialKilledToWin from './sharedSagas/handleImperialKilledToWin';
import handleStatusPhaseBegin from './sharedSagas/handleStatusPhaseBegin';
import helperDeploy from './helpers/helperDeploy';
import helperEventModal from './helpers/helperEventModal';
import helperIncreaseThreat from './helpers/helperIncreaseThreat';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import {REFER_CAMPAIGN_GUIDE, TARGET_CLOSEST_REBEL} from './constants';
import type {StateType} from '../types';
import track from '../../lib/track';

// Constants

const TARGET_KAYN = 'Kayn Somos';

const DEPLOYMENT_POINT_GREEN_W = 'The west green deployment point';
const DEPLOYMENT_POINT_GREEN_E = 'The east green deployment point';

// Types

export type PastLifeEnemiesStateType = {
  doorOpened: boolean,
  priorityTargetKillHero: boolean,
};

// State

const initialState = {
  doorOpened: false,
  priorityTargetKillHero: false,
};

export default (state: PastLifeEnemiesStateType = initialState, action: Object) => {
  switch (action.type) {
    case 'PAST_LIFE_ENEMIES_PRIORITY_TARGET_KILL_HERO':
      return {
        ...state,
        priorityTargetKillHero: action.payload,
      };
    case 'PAST_LIFE_ENEMIES_DOOR_OPENED':
      return {
        ...state,
        doorOpened: true,
      };
    default:
      return state;
  }
};

// Selectors

export const getPastLifeEnemiesGoalText = (state: StateType): string[] => {
  const {doorOpened} = state.pastLifeEnemies;
  const {missionThreat} = state.app;
  let goals = [];

  if (!doorOpened) {
    goals = goals.concat(['{BOLD}Current Goal:{END}', 'Open a door.', '{BREAK}']);
  }

  goals = goals.concat([
    '{BOLD}C-3PO:{END}',
    'Starts out deactivated as a neutral figure who does not block LOS. A Rebel figure can interact to make him operational and turn him into an ally.',
    'If he is defeated, he is deactivated again and discards all condition and damage tokens.',
    '{BREAK}',
    '{BOLD}Terminals:{END}',
    'An Imperial figure can interact to raise threat by 1. Limit once per terminal per round.',
    '{BREAK}',
    `A Rebel figure can attack to destroy (Health: ${missionThreat}, Defense: 1 {BLOCK}. {ELITE}C-3PO{END} can interact to discard.`,
    '{BREAK}',
    '{BOLD}Doors:{END}',
    `Locked. A Rebel figure can attack to open (Health: ${missionThreat}, Defense: 1 {BLOCK}. {ELITE}C-3PO{END} can interact to open.`,
    '{BREAK}',
    '{BOLD}C-3PO Activation:{END}',
    'Click the button to activate {ELITE}C-3PO{END}.',
  ]);

  return goals;
};

// Sagas

function getRandomDeploymentPoint() {
  return getRandomItem(DEPLOYMENT_POINT_GREEN_W, DEPLOYMENT_POINT_GREEN_E);
}

function* handleRaiderAmbush(): Generator<*, *, *> {
  track('pastLifeEnemies', 'raiderAmbush', 'triggered');
  yield call(
    helperDeploy,
    'Raider Ambush',
    "Before you know it, you're surrounded!",
    ['A Tusken Raider group will now be deployed.'],
    ['tuskenRaider', 'Deploy to the blue point.']
  );
}

function* handleTheCommander(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {type, value} = action.payload;
    if (type === 'door' && value === true) {
      track('pastLifeEnemies', 'theCommander', 'triggered');
      const missionThreat = yield select(getMissionThreat);

      yield call(
        helperDeploy,
        'The Commander',
        REFER_CAMPAIGN_GUIDE,
        [
          'All doors will now open.',
          '{ELITE}Kayn Somos{END} and a Stormtrooper group will now be deployed.',
          'The Rebels win when {ELITE}Kayn Somos{END} is defeated!',
        ],
        ['kaynSomos', `Deploy to the red deployment point. He gains ${missionThreat + 1} Health.`],
        ['stormtrooper', 'Deploy to the red deployment point.']
      );
      yield put(setMapStateActivated(1, 'door', true));
      yield put(setMapStateActivated(2, 'door', true));
      yield put(setImperialUnitHpBuff('kaynSomos', missionThreat + 1));
      yield put(updateRebelVictory('Defeat Kayn Somos'));
      yield put(createAction('PAST_LIFE_ENEMIES_DOOR_OPENED'));
      yield put(setMoveTarget(TARGET_KAYN));
      // We're done
      break;
    }
  }
}

function* handleTerminalUsed(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (type === 'terminal' && value === true) {
      yield call(helperEventModal, {
        story: 'A signal has been sent out for backup...',
        text: ['The threat has been increased by 1.'],
        title: 'Imperial Terminal',
      });
      yield put(increaseThreat(1));
      // Disable this terminal until end of round
      yield put(setMapStateInteractable(id, 'terminal', false));
    }
  }
}

function* handleC3PO(): Generator<*, *, *> {
  while (true) {
    yield take('PAST_LIFE_ENEMIES_ACTIVATE_C3PO');

    // Stop the user from spamming the button
    const roster = yield select(getRoster);

    if (!roster.includes('c3p0')) {
      yield call(helperEventModal, {
        story: REFER_CAMPAIGN_GUIDE,
        text: ['C-3PO has been added as an ally.'],
        title: 'Primary Function',
      });
      yield put(addToRoster('c3p0'));
    }
  }
}

function* handleC3PODefeated(): Generator<*, *, *> {
  while (true) {
    const action = yield take(WOUND_REBEL_OTHER);
    const {id} = action.payload;

    if (id === 'c3p0') {
      yield call(helperEventModal, {
        text: [
          '{ELITE}C-3PO{END} remains on the map as a neutral figure. He discards all conditions and damage tokens and becomes deactivated.',
        ],
        title: 'C-3PO',
      });
    }
  }
}

// REQUIRED SAGA
function* handleRoundEnd(): Generator<*, *, *> {
  while (true) {
    yield take(STATUS_PHASE_END_ROUND_EFFECTS);
    const currentRound = yield select(getCurrentRound);

    // Allow all terminals to be used again
    yield put(setMapStateActivated(1, 'terminal', false));
    yield put(setMapStateActivated(2, 'terminal', false));
    yield put(setMapStateActivated(3, 'terminal', false));
    yield put(setMapStateInteractable(1, 'terminal', true));
    yield put(setMapStateInteractable(2, 'terminal', true));
    yield put(setMapStateInteractable(3, 'terminal', true));

    if (currentRound === 3) {
      yield call(handleRaiderAmbush);
    } else if (currentRound === 7) {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      track('pastLifeEnemies', 'defeat', 'round');
      break;
    }

    yield put(setDeploymentPoint(getRandomDeploymentPoint()));
    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(helperInitialSetup, [
    'eWebEngineer',
    'heavyStormtrooper',
    'imperialOfficer',
    'probeDroid',
  ]);
  yield call(helperEventModal, {
    text: [
      'The heroes cannot bring {ELITE}C-3PO{END} as an ally.',
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

  const missionThreat = yield select(getMissionThreat);
  yield call(helperMissionBriefing, [
    '{ELITE}C-3PO{END} starts out deactivated as a neutral figure who does not block LOS. A Rebel figure can interact to make him operational and turn him into an ally.',
    'If he is defeated, he is deactivated again and discards all condition and damage tokens.',
    'An Imperial figure can interact with a terminal to raise threat by 1. Limit once per terminal per round.',
    `A Rebel figure can attack a terminal to destroy it (Health: ${missionThreat}, Defense: 1 {BLOCK}. {ELITE}C-3PO{END} can interact to discard it.`,
    `Doors are locked. A Rebel figure can attack to open (Health: ${missionThreat}, Defense: 1 {BLOCK}. {ELITE}C-3PO{END} can interact to open.`,
  ]);

  yield put(missionSpecialSetupDone());
}

// Not really sure where to target so just target closest Rebel initially
export function* pastLifeEnemies(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_CLOSEST_REBEL));
  yield put(setMoveTarget(TARGET_CLOSEST_REBEL));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(getRandomDeploymentPoint()));

  // TODO: No logic to use terminals since +1 threat is pretty weak and a waste of AI commands
  // Revisit at a future date?

  yield all([
    fork(handleSpecialSetup),
    fork(handleTerminalUsed),
    fork(handleTheCommander),
    fork(handleImperialKilledToWin('kaynSomos', 'pastLifeEnemies')),
    fork(handleC3PO),
    fork(handleC3PODefeated),
    fork(handleHeroesWounded('pastLifeEnemies', 'PAST_LIFE_ENEMIES_PRIORITY_TARGET_KILL_HERO')),
    fork(handleStatusPhaseBegin),
    fork(handleRoundEnd),
  ]);

  track('missionStart', 'pastLifeEnemies');
  yield put(missionSagaLoadDone());
}
