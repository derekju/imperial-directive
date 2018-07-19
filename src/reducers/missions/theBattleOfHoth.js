// @flow

import {addToRoster, WOUND_REBEL_OTHER} from '../rebels';
import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {DEFEAT_IMPERIAL_FIGURE, getCurrentGroups} from '../imperials';
import {
  disableThreatIncrease,
  getCurrentRound,
  increaseThreat,
  MISSION_SPECIAL_SETUP,
  missionSpecialSetupDone,
  SET_MAP_STATE_ACTIVATED,
  setAttackTarget,
  setDeploymentPoint,
  setMapStateVisible,
  setMoveTarget,
  STATUS_PHASE_END_ROUND_EFFECTS,
  statusPhaseEndRoundEffectsDone,
  updateRebelVictory,
} from '../mission';
import {REFER_CAMPAIGN_GUIDE, TARGET_HERO_CLOSEST_UNWOUNDED} from './constants';
import createAction from '../createAction';
import {displayModal} from '../modal';
import getRandomItem from '../utils/getRandomItem';
import handleHeroesWounded from './sharedSagas/handleHeroesWounded';
import handleStatusPhaseBegin from './sharedSagas/handleStatusPhaseBegin';
import helperCheckMapStateActivations from './helpers/helperCheckMapStateActivations';
import helperDeploy from './helpers/helperDeploy';
import helperEventModal from './helpers/helperEventModal';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import missions from '../../data/missions';
import {missionSagaLoadDone} from '../app';
import snakeCase from 'lodash/snakeCase';
import type {StateType} from '../types';
import track from '../../lib/track';

// Constants

const MISSION_NAME = 'theBattleOfHoth';
const MISSION_NAME_S = snakeCase(MISSION_NAME).toUpperCase();

const TARGET_CLOSEST_INACTIVE_POWER = 'the closest inactive power station';

const DEPLOYMENT_POINT_GREEN_N = 'The north green deployment point';
const DEPLOYMENT_POINT_GREEN_E = 'The east green deployment point';
const DEPLOYMENT_POINT_GREEN_S = 'The south green deployment point';
const DEPLOYMENT_POINT_GREEN_W = 'The west green deployment point';

// Types

export type TheBattleOfHothStateType = {
  allStationsActive: boolean,
  deepFreezeActive: boolean,
  priorityTargetKillHero: boolean,
};

// State

const initialState = {
  allStationsActive: false,
  deepFreezeActive: false,
  priorityTargetKillHero: false,
};

export default (state: TheBattleOfHothStateType = initialState, action: Object) => {
  switch (action.type) {
    case `${MISSION_NAME_S}_PRIORITY_TARGET_KILL_HERO`:
      return {
        ...state,
        priorityTargetKillHero: action.payload,
      };
    case `${MISSION_NAME_S}_DEEP_FREEZE_ACTIVE`:
      return {
        ...state,
        deepFreezeActive: true,
      };
    case `${MISSION_NAME_S}_ALL_STATIONS_ACTIVE`:
      return {
        ...state,
        allStationsActive: true,
      };
    default:
      return state;
  }
};

// Selectors

// const getState = (state: StateType) => state[MISSION_NAME];
export const getTheBattleOfHothGoalText = (state: StateType): string[] => {
  let goals = [];

  const {allStationsActive, deepFreezeActive} = state.theBattleOfHoth;

  if (!allStationsActive) {
    goals = goals.concat(['{BOLD}Current Goal:{END}', 'Activate all power stations.', '{BREAK}']);
  }

  if (deepFreezeActive) {
    goals = goals.concat([
      '{BOLD}Deep Freeze:{END}',
      'Heroes cannot recover {DAMAGE} except from Medical cards.',
      '{BREAK}',
    ]);
  }

  goals = goals.concat([
    '{BOLD}Terminals:{END}',
    'Once per activation, interact to choose a hostile figure and roll 1 red die to deal 1 plus the {DAMAGE} results. That terminal is discarded.',
    '{BREAK}',
    '{BOLD}Power Stations:{END}',
    'Mission tokens on the Imperial side. Interact ({INSIGHT} or {TECH}) to activate and flip the token.',
    '{BREAK}',
    '{BOLD}Echo Base Trooper:{END}',
    'When defeated the threat is increased by 2.',
    '{BREAK}',
  ]);

  return goals;
};

// Sagas

function getRandomDeploymentPoint() {
  return getRandomItem(
    DEPLOYMENT_POINT_GREEN_N,
    DEPLOYMENT_POINT_GREEN_E,
    DEPLOYMENT_POINT_GREEN_S,
    DEPLOYMENT_POINT_GREEN_W
  );
}

function* handleADeadlyTurn(): Generator<*, *, *> {
  track(MISSION_NAME, 'aDeadlyTurn', 'triggered');

  const allStationsActive = yield call(
    helperCheckMapStateActivations,
    ['imperial-1', 'imperial-2', 'imperial-3', 'imperial-4'],
    4
  );

  yield call(
    helperDeploy,
    'A Deadly Turn',
    REFER_CAMPAIGN_GUIDE,
    ['An {ELITE}SC2-M Repulsor Tank{END} will now be deployed.'],
    [
      'sc2mRepulsorTank',
      allStationsActive
        ? 'Deploy to a spot closest to the most Rebel figures'
        : 'Deploy to an inactive power station closest to the most Rebel figures.',
    ]
  );
}

function* handleHopesDashed(): Generator<*, *, *> {
  track(MISSION_NAME, 'hopesDashed', 'triggered');

  const allStationsActive = yield call(
    helperCheckMapStateActivations,
    ['imperial-1', 'imperial-2', 'imperial-3', 'imperial-4'],
    4
  );

  yield call(
    helperDeploy,
    'Hopes Dashed',
    REFER_CAMPAIGN_GUIDE,
    ['{ELITE}Dengar{END} will now be deployed.'],
    [
      'dengar',
      allStationsActive
        ? 'Deploy to a spot closest to the most Rebel figures'
        : 'Deploy to an inactive power station closest to the most Rebel figures.',
    ]
  );
}

function* handleDeepFreeze(): Generator<*, *, *> {
  track(MISSION_NAME, 'deepFreeze', 'triggered');

  yield put(createAction(`${MISSION_NAME_S}_DEEP_FREEZE_ACTIVE`));

  yield call(helperEventModal, {
    story: REFER_CAMPAIGN_GUIDE,
    text: [
      'For the rest of the mission, heroes cannot recover {DAMAGE} except from Medical cards.',
    ],
    title: 'Deep Freeze',
  });
}

function* handleTerminalActivation(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (type === 'terminal' && value === true) {
      track(MISSION_NAME, 'terminal', 'activated', value);

      yield call(helperEventModal, {
        text: [
          'Choose a hostile figure and roll one red die. That figure suffers {DAMAGE} equal to 1 plus the {DAMAGE} results.',
          'Discard this terminal.',
        ],
        title: 'Turrets',
      });

      yield put(setMapStateVisible(id, type, false));
    }
  }
}

function* handleRiggedToBlow(): Generator<*, *, *> {
  track(MISSION_NAME, 'riggedToBlow', 'triggered');

  yield call(helperEventModal, {
    text: [
      'Choose an active power station closest to the most Rebel troops and roll one red die.',
      'Each Rebel figure on or adjacent to that power station suffers {DAMAGE} equal the {DAMAGE} results and suffers Bleeding.',
    ],
    title: 'Rigged To Blow',
  });
}

function* handleFinalSurge(): Generator<*, *, *> {
  track(MISSION_NAME, 'finalSurge', 'triggered');

  yield put(increaseThreat(3));
  yield call(helperEventModal, {
    text: ['The threat has been increased by 3.'],
    title: 'Final Surge',
  });
}

function* handleFightThemBack(): Generator<*, *, *> {
  track(MISSION_NAME, 'fightThemBack', 'triggered');
  yield put(createAction(`${MISSION_NAME_S}_ALL_STATIONS_ACTIVE`));

  yield call(helperEventModal, {
    story: REFER_CAMPAIGN_GUIDE,
    text: [
      'For the rest of the mission, threat cannot increase.',
      'The Rebels win when all Imperial figures have been defeated.',
    ],
    title: 'Fight Them Back',
  });

  yield put(disableThreatIncrease());
  yield put(updateRebelVictory('When all Imperial figures have been defeated'));
  yield put(setMoveTarget(TARGET_HERO_CLOSEST_UNWOUNDED));

  yield fork(handleImperialFigureCheck);
}

function* handleImperialFigureCheck(): Generator<*, *, *> {
  // Check first in case no units are present when this is triggered
  const {deployedGroups} = yield select(getCurrentGroups);
  if (deployedGroups.length === 0) {
    // End game with rebel victory
    yield put(displayModal('REBEL_VICTORY'));
    track(MISSION_NAME, 'victory', 'killedAll');
  }

  // Now loop and check
  while (true) {
    yield take(DEFEAT_IMPERIAL_FIGURE);
    const {deployedGroups} = yield select(getCurrentGroups);

    if (deployedGroups.length === 0) {
      // End game with rebel victory
      yield put(displayModal('REBEL_VICTORY'));
      track(MISSION_NAME, 'victory', 'killedAll');
      break;
    }
  }
}

function* handlePowerStationActivation(): Generator<*, *, *> {
  let riggedToBlowHandled = false;
  let finalSurgeHandled = false;
  let fightThemBackHandled = false;

  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {type, value} = action.payload;
    if (type === 'imperial' && value === true) {
      track(MISSION_NAME, 'powerStation', 'activated', value);

      yield call(helperEventModal, {
        text: ['Flip the mission token to the Rebel side.', 'This station is now activated.'],
        title: 'Power Station',
      });

      const triggerRiggedToBlow = yield call(
        helperCheckMapStateActivations,
        ['imperial-1', 'imperial-2', 'imperial-3', 'imperial-4'],
        2
      );

      const triggerFinalSurge = yield call(
        helperCheckMapStateActivations,
        ['imperial-1', 'imperial-2', 'imperial-3', 'imperial-4'],
        3
      );

      const triggerFightThemBack = yield call(
        helperCheckMapStateActivations,
        ['imperial-1', 'imperial-2', 'imperial-3', 'imperial-4'],
        4
      );

      if (triggerRiggedToBlow && !riggedToBlowHandled) {
        riggedToBlowHandled = true;
        yield call(handleRiggedToBlow);
      }

      if (triggerFinalSurge && !finalSurgeHandled) {
        finalSurgeHandled = true;
        yield call(handleFinalSurge);
      }

      if (triggerFightThemBack && !fightThemBackHandled) {
        fightThemBackHandled = true;
        yield call(handleFightThemBack);

        // We're done
        break;
      }
    }
  }
}

function* handleEchoTrooperKilled(): Generator<*, *, *> {
  while (true) {
    const action = yield take(WOUND_REBEL_OTHER);
    const {id} = action.payload;
    if (id === 'echoBaseTrooper') {
      // Increase threat
      yield put(increaseThreat(2));

      yield call(helperEventModal, {
        text: ['The threat has been increased by 2.'],
        title: 'The Battle of Hoth',
      });
    }
  }
}

// REQUIRED SAGA
function* handleRoundEnd(): Generator<*, *, *> {
  while (true) {
    yield take(STATUS_PHASE_END_ROUND_EFFECTS);
    const currentRound = yield select(getCurrentRound);

    if (currentRound === 1) {
      yield call(handleADeadlyTurn);
    } else if (currentRound === 3) {
      yield call(handleHopesDashed);
    } else if (currentRound === 5) {
      yield call(handleDeepFreeze);
    }

    yield put(setDeploymentPoint(getRandomDeploymentPoint()));
    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(helperInitialSetup, missions[MISSION_NAME].initialGroups);
  yield call(helperEventModal, {
    text: ['The heroes control the Echo Base Troopers as an ally at no additional cost.'],
    title: 'Initial Setup',
  });

  // Deploy Echo Base Troopers
  yield put(addToRoster('echoBaseTrooper'));

  yield call(helperMissionBriefing, [
    'Once per activation, a Rebel figure can interact with a terminal to choose a hostile figure and roll 1 red die. That figure suffers {DAMAGE} equal to 1 plus the {DAMAGE} results. That terminal is then discarded.',
    'Mission tokens are power stations. When the Rebel side is showing, that station is active.',
    'A hero can interact with an inactive power station ({INSIGHT} or {TECH}) to activate it. Flip the token.',
    'When an Echo Base Trooper is defeated, the threat is increased by 2.',
  ]);

  yield put(missionSpecialSetupDone());
}

export function* theBattleOfHoth(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
  yield put(setMoveTarget(TARGET_CLOSEST_INACTIVE_POWER));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(getRandomDeploymentPoint()));

  yield all([
    fork(handleSpecialSetup),
    fork(handleTerminalActivation),
    fork(handlePowerStationActivation),
    fork(handleEchoTrooperKilled),
    fork(handleHeroesWounded(MISSION_NAME, `${MISSION_NAME_S}_PRIORITY_TARGET_KILL_HERO`)),
    fork(handleStatusPhaseBegin),
    fork(handleRoundEnd),
  ]);

  track('missionStart', MISSION_NAME);
  yield put(missionSagaLoadDone());
}
