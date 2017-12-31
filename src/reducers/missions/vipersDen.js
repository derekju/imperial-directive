// @flow

import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {
  enableEscape,
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
import {OPTIONAL_DEPLOYMENT_DONE, optionalDeployment, setCustomAI} from '../imperials';
import {
  REFER_CAMPAIGN_GUIDE,
  TARGET_HERO_CLOSEST_UNWOUNDED,
  TARGET_REMAINING,
} from './constants';
import createAction from '../createAction';
import {displayModal} from '../modal';
import helperDeploy from './helpers/helperDeploy';
import helperEventModal from './helpers/helperEventModal';
import helperIncreaseThreat from './helpers/helperIncreaseThreat';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import {missionSagaLoadDone} from '../app';
import type {StateType} from '../types';
import track from '../../lib/track';

// Constants

const TARGET_DOOR_2 = 'door 2';
const TARGET_DATA_CORE = 'the data core';
const TARGET_HERO_CORE = 'the hero carrying the data core';

const DEPLOYMENT_POINT_GREEN_N = 'The northern green deployment point';
const DEPLOYMENT_POINT_GREEN_E = 'The eastern green deployment point';

const AI_EXCLUSION = [
  'atst',
  'darthVader',
  'eWebEngineer',
  'eWebEngineerElite',
  'generalWeiss',
  'ig88',
  'nexu',
  'nexuElite',
  'royalGuardChampion',
  'trandoshanHunter',
  'trandoshanHunterElite',
];

const ATTACK_DOOR_2_AI = [
  {
    command:
      '{ACTION} Move until in attack range of door 2, then {ACTION} Move until in attack range of door 2.',
    condition: 'If not in attack range of door 2',
  },
  {
    command: '{ACTION} Attack door 2.',
    condition: 'If in attack range of door 2',
  },
];

const FETCH_CORE_AI = [
  {
    command:
      '{ACTION} Move until adjacent to the data core, then {ACTION} Move until adjacent to the data core.',
    condition: 'If not adjacent to the data core',
  },
  {
    command: '{ACTION} Interact to retrieve data core, then {ACTION} Move towards the entrance.',
    condition: 'If adjacent to the data core',
  },
];

const GOT_CORE_AI = [
  {
    command:
      '{ACTION} Move until adjacent to the entrance token, then {ACTION} Move until adjacent to the entrance token.',
    condition: 'If figure has the data core',
  },
  {
    command: '{ACTION} Escape through the entrance.',
    condition: 'If figure has the data core and is adjacent to the entrance',
  },
  {
    command:
      '{ACTION} Move until adjacent to friendly figure with data core, then {ACTION} Move until adjacent to friendly figure with data core.',
    condition: 'If another friendly figure has the data core',
  },
];

// Types

export type VipersDenStateType = {
  currentCoreOwner: string,
  priorityTargetKillHero: boolean,
};

// State

const initialState = {
  currentCoreOwner: 'None',
  priorityTargetKillHero: false,
};

export default (state: VipersDenStateType = initialState, action: Object) => {
  switch (action.type) {
    case 'VIPERS_DEN_HERO_GET_CORE':
      return {
        ...state,
        currentCoreOwner: 'Rebels',
      };
    case 'VIPERS_DEN_IMPERIAL_GET_CORE':
      return {
        ...state,
        currentCoreOwner: 'Imperials',
      };
    case 'VIPERS_DEN_FIGURE_DROPS_CORE':
      return {
        ...state,
        currentCoreOwner: 'None',
      };
    case 'VIPERS_DEN_PRIORITY_TARGET_KILL_HERO':
      return {
        ...state,
        priorityTargetKillHero: action.payload,
      };
    default:
      return state;
  }
};

// Selectors

const getState = (state: StateType) => state.vipersDen;
export const getVipersDenGoalText = (state: StateType): string[] => {
  const goals = [
    '{BOLD}Current Core Owner:{END}',
    `${state.vipersDen.currentCoreOwner}`,
    '{BREAK}',
    '{BOLD}Doors:{END}',
    'Doors are locked. A figure can attack to open (Health: 8, Defense: None).',
    '{BREAK}',
    '{BOLD}Data Core:{END}',
    'If a figure picks up the core, click the button for whichever side got it.',
    '{BREAK}',
    'If a figure drops the core, click the bottom button.',
    '{BREAK}',
  ];

  return goals;
};

// Sagas

function* handleFindTheDroidEvent(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {type, value} = action.payload;
    if (type === 'door' && value === true) {
      track('vipersDen', 'findTheDroid', 'triggered');
      yield call(
        helperDeploy,
        REFER_CAMPAIGN_GUIDE,
        [
          'Deploy an {ELITE}Elite Imperial Officer{END} and a Stormtrooper group to the yellow point.',
        ],
        'Find the Droid',
        ['imperialOfficerElite', 'stormtrooper']
      );
      break;
    }
  }
}

function* handleDoorOpened(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 2 && type === 'door' && value === true) {
      yield put(setCustomAI(FETCH_CORE_AI, AI_EXCLUSION));
      yield put(setAttackTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
      yield put(setMoveTarget(TARGET_DATA_CORE));
      break;
    }
  }
}

function* handleImperialsGotCore(): Generator<*, *, *> {
  while (true) {
    yield take('VIPERS_DEN_IMPERIAL_GET_CORE');
    yield put(setCustomAI(GOT_CORE_AI, AI_EXCLUSION));
    yield put(setMoveTarget(TARGET_DATA_CORE));
    yield put(setMapStateActivated(1, 'imperial', true));
    yield call(helperEventModal, {
      story: 'Due to cunning intelligence the Imperial troops have retrieved the data core.',
      text: ['The imperials have the core and are trying to make an escape to the entrance!'],
      title: "Viper's Den",
    });
    yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN_E));
  }
}

function* handleRebelsGotCore(): Generator<*, *, *> {
  while (true) {
    yield take('VIPERS_DEN_HERO_GET_CORE');
    // Remove custom AI so units are aggresive again
    yield put(setCustomAI(null));
    yield put(setAttackTarget(TARGET_HERO_CORE));
    yield put(setMoveTarget(TARGET_HERO_CORE));
    yield put(setMapStateActivated(1, 'imperial', true));
    yield call(helperEventModal, {
      story: 'The facility erupts in activity as the Imperial troops race after you.',
      text: ['The Rebels have the core!'],
      title: "Viper's Den",
    });
    yield put(enableEscape());
    yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN_E));
  }
}

function* handleDroppedCore(): Generator<*, *, *> {
  while (true) {
    yield take('VIPERS_DEN_FIGURE_DROPS_CORE');
    yield put(setCustomAI(FETCH_CORE_AI, AI_EXCLUSION));
    yield put(setAttackTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
    yield put(setMoveTarget(TARGET_DATA_CORE));
    yield call(helperEventModal, {
      text: ['The data core was dropped.'],
      title: "Viper's Den",
    });
  }
}

function* handleHeroEscapes(): Generator<*, *, *> {
  yield take(SET_REBEL_ESCAPED);
  // Just assume if someone escapes the rebels won
  // It's up to the player not to abuse the escape button
  yield put(displayModal('REBEL_VICTORY'));
  track('vipersDen', 'victory', 'escaped');
}

function* handleImperialEscapes(): Generator<*, *, *> {
  while (true) {
    yield take('VIPERS_DEN_IMPERIAL_ESCAPES');
    const {currentCoreOwner} = yield select(getState);
    if (currentCoreOwner !== 'Imperials') {
      yield call(helperEventModal, {
        text: ['An Imperial figure needs to be holding the data core to escape.'],
        title: "Viper's Den",
      });
    } else {
      yield put(displayModal('IMPERIAL_VICTORY'));
      track('vipersDen', 'victory', 'dataCore');
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
      track('vipersDen', 'defeat', 'wounded');
      break;
    }
    const isOneHeroLeft = yield select(getIsOneHeroLeft);
    if (isOneHeroLeft) {
      yield put(createAction('VIPERS_DEN_PRIORITY_TARGET_KILL_HERO', true));
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
  yield call(helperInitialSetup, 'E-Web Engineer, Stormtrooper, Trandoshan Hunter');
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
    'The mission token is the data core. Any figure (Rebel or Imperial) can interact to retrieve the core.',
    'A figure carrying the core can escape through the entrance.',
    'Doors are locked. Any figure can attack the door to open it (Health: 8, Defense: None).',
  ]);
  yield put(missionSpecialSetupDone());
}

/*
Priority target definitions:
1) Initial attack is default, move is door 2
2) If core is picked up by rebels, attack is hero with core, move is hero with core
3) If core is picked up by imperials, unit carrying rushes to entrance. Everyone else surrounds that figure.
4) At any point if heroes - 1 are wounded, attack and move are the last remaining hero
*/
export function* vipersDen(): Generator<*, *, *> {
  // Set targets for units not following custom AI
  yield put(setAttackTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
  yield put(setMoveTarget(TARGET_DOOR_2));
  yield put(setCustomAI(ATTACK_DOOR_2_AI, AI_EXCLUSION));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN_N));

  yield all([
    fork(handleSpecialSetup),
    fork(handleFindTheDroidEvent),
    fork(handleDoorOpened),
    fork(handleImperialsGotCore),
    fork(handleRebelsGotCore),
    fork(handleDroppedCore),
    fork(handleHeroEscapes),
    fork(handleImperialEscapes),
    fork(handleHeroesWounded),
    fork(handleRoundEnd),
  ]);

  track('missionStart', 'vipersDen');
  yield put(missionSagaLoadDone());
}
