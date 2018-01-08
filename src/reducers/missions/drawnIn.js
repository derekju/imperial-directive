// @flow

import {
  enableEscape,
  getAreAllHeroesWounded,
  getIsOneHeroLeft,
  SET_REBEL_ESCAPED,
  WOUND_REBEL_HERO,
} from '../rebels';
import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {
  getCurrentRound,
  getCurrentThreat,
  getDeploymentPoint,
  getMapStates,
  increaseThreat,
  MISSION_SPECIAL_SETUP,
  missionSpecialSetupDone,
  SET_MAP_STATE_ACTIVATED,
  setAttackTarget,
  setDeploymentPoint,
  setExtraThreatIncrease,
  setMapStateVisible,
  setMoveTarget,
  STATUS_PHASE_BEGIN,
  STATUS_PHASE_END_ROUND_EFFECTS,
  statusPhaseBeginDone,
  statusPhaseEndRoundEffectsDone,
} from '../mission';
import createAction from '../createAction';
import {
  getDeployedGroupOfIdWithMostUnits,
  isGroupIdInDeployedGroups,
  setInterruptedGroup,
  SET_INTERRUPTED_GROUP,
} from '../imperials';
import {
  REFER_CAMPAIGN_GUIDE,
  TARGET_ENTRANCE_TOKEN,
  TARGET_HERO_CLOSEST_UNWOUNDED,
  TARGET_REMAINING,
} from './constants';
import {displayModal} from '../modal';
import helperChoiceModal from './helpers/helperChoiceModal';
import helperDeploy from './helpers/helperDeploy';
import helperEventModal from './helpers/helperEventModal';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import {missionSagaLoadDone} from '../app';
import random from 'lodash/random';
import type {StateType} from '../types';
import track from '../../lib/track';

// Constants

const TARGET_POWER_STATION = 'the closest power station (or door blocking station)';

const DEPLOYMENT_POINT_GREEN_N = 'The northern green deployment point';
const DEPLOYMENT_POINT_GREEN_E = 'The eastern green deployment point';
const DEPLOYMENT_POINT_GREEN_S = 'The southern green deployment point';
const DEPLOYMENT_POINT_GREEN_W = 'The western green deployment point';

// Types

export type DrawnInStateType = {
  priorityTargetKillHero: boolean,
};

// State

const initialState = {
  priorityTargetKillHero: false,
};

export default (state: DrawnInStateType = initialState, action: Object) => {
  switch (action.type) {
    case 'DRAWN_IN_PRIORITY_TARGET_KILL_HERO':
      return {
        ...state,
        priorityTargetKillHero: true,
      };
    default:
      return state;
  }
};

// Selectors

const getState = (state: StateType) => state.drawnIn;
export const getDrawnInGoalText = (state: StateType): string[] => {
  let goals = [];

  goals = goals.concat([
    '{BOLD}Departing:{END}',
    'Once all power stations are destroyed and all heroes are adjacent to the entrance, escape with a hero to win the mission.',
    '{BREAK}',
    '{BOLD}Power Stations (terminals):{END}',
    'Power stations have Health: 8, Defense: 1 {BLOCK}',
    '{BREAK}',
    '{BOLD}Doors:{END}',
    'Doors are locked. Interact ({STRENGTH} or {TECH}) to open.',
    '{BREAK}',
    '{BOLD}Withdrawn hero:{END}',
    'Withdrawn heroes receive only 1 action and they can only move.',
  ]);

  return goals;
};

// Sagas

function* handleSubdueEvent(chosenOption: number = -1): Generator<*, *, *> {
  let newChosenOption = -1;
  // Choices
  // 1) Open/close one door
  // 2) 1 threat: choose a crate, each figure within 3 heals 2
  // 3) 1 threat: a stromtrooper group and do a move or attack
  // 4) 1 threat: royal guard champion can do 1 action

  // If no threat, have to choose the first option
  const currentThreat = yield select(getCurrentThreat);
  if (chosenOption !== 0 && currentThreat === 0) {
    yield call(helperEventModal, {
      story: 'The Imperial army is doing everything they can to stop you.',
      text: [
        'If all power stations are destroyed and door 4 is closed, open it.',
        'If any doors are open to its closest active power station, choose one to close it.',
      ],
      title: 'Subdue',
    });

    newChosenOption = 0;
  } else {
    // If we have 2 threat, do the royal guard champion action if he exists
    const royalGuardExists = yield select(isGroupIdInDeployedGroups, 'royalGuardChampion');
    const stormtrooperExists = yield select(isGroupIdInDeployedGroups, 'stormtrooper');
    if (chosenOption !== 1 && royalGuardExists && currentThreat >= 2) {
      const group = yield select(getDeployedGroupOfIdWithMostUnits, 'royalGuardChampion');
      yield call(helperEventModal, {
        story: 'The Imperial army is doing everything they can to stop you.',
        text: [
          'The Imperials spend 2 threat.',
          'The {ELITE}Royal Guard Champion{END} may perform 1 action now.',
          'The AI card will now be displayed.',
        ],
        title: 'Subdue',
      });
      yield put(increaseThreat(-2));
      yield put(setInterruptedGroup(group));
      yield take(SET_INTERRUPTED_GROUP);
      newChosenOption = 1;
    } else if (chosenOption !== 2 && stormtrooperExists && currentThreat >= 1) {
      // Need to figure out which stormtrooper group to select though. Preferably the one with the most units
      const group = yield select(getDeployedGroupOfIdWithMostUnits, 'stormtrooper');
      yield call(helperEventModal, {
        story: 'The Imperial army is doing everything they can to stop you.',
        text: [
          'The Imperials spend 1 threat.',
          `Each figure in Stormtrooper group ${group.groupNumber} may move or attack.`,
          'The AI card will now be displayed.',
        ],
        title: 'Subdue',
      });
      yield put(increaseThreat(-1));
      yield put(setInterruptedGroup(group));
      yield take(SET_INTERRUPTED_GROUP);
      newChosenOption = 2;
    } else if (chosenOption !== 3 && currentThreat >= 1) {
      const answer = yield call(
        helperChoiceModal,
        'Are there any damaged Imperial figures within 3 spaces of a crate?',
        'Subdue'
      );
      if (answer === 'yes') {
        yield call(helperEventModal, {
          story: 'The Imperial army is doing everything they can to stop you.',
          text: [
            'Choose 1 crate on the map. Each Imperial figure within 3 spaces of that crate recovers 2 {DAMAGE}.',
          ],
          title: 'Subdue',
        });
        yield put(increaseThreat(-1));
      }
      newChosenOption = 3;
    }
  }

  const newCurrentThreat = yield select(getCurrentThreat);
  // If equal to -1 that means we can do this again as long as we have the threat for it
  if (chosenOption === -1 && newCurrentThreat >= 1) {
    yield call(helperEventModal, {
      story: 'The Imperial army is doing everything they can to stop you.',
      text: ['The Imperials spend 1 threat to trigger the Subdue event again.'],
      title: 'Subdue',
    });
    yield put(increaseThreat(-1));
    yield call(handleSubdueEvent, newChosenOption);
  }
}

function* handleArrivalEvent(): Generator<*, *, *> {
  while (true) {
    yield take(SET_MAP_STATE_ACTIVATED);
    const mapStates = yield select(getMapStates);
    const results = [];
    if (mapStates['terminal-1'].activated) {
      yield put(setMapStateVisible(1, 'terminal', false));
      results.push('terminal-1');
    }
    if (mapStates['terminal-2'].activated) {
      yield put(setMapStateVisible(2, 'terminal', false));
      results.push('terminal-2');
    }
    if (mapStates['terminal-3'].activated) {
      yield put(setMapStateVisible(3, 'terminal', false));
      results.push('terminal-3');
    }
    if (mapStates['terminal-4'].activated) {
      yield put(setMapStateVisible(4, 'terminal', false));
      results.push('terminal-4');
    }

    if (results.length === 2) {
      const deploymentPoint = yield select(getDeploymentPoint);
      yield call(
        helperDeploy,
        REFER_CAMPAIGN_GUIDE,
        [`Deploy a {ELITE}Royal Guard Champion{END} to: ${deploymentPoint}.`],
        'Arrival',
        ['royalGuardChampion']
      );
      break;
    }
  }
}

function* handlePowerStationsDestroyed(): Generator<*, *, *> {
  while (true) {
    yield take(SET_MAP_STATE_ACTIVATED);
    const mapStates = yield select(getMapStates);
    const results = [];
    if (mapStates['terminal-1'].activated) {
      yield put(setMapStateVisible(1, 'terminal', false));
      results.push('terminal-1');
    }
    if (mapStates['terminal-2'].activated) {
      yield put(setMapStateVisible(2, 'terminal', false));
      results.push('terminal-2');
    }
    if (mapStates['terminal-3'].activated) {
      yield put(setMapStateVisible(3, 'terminal', false));
      results.push('terminal-3');
    }
    if (mapStates['terminal-4'].activated) {
      yield put(setMapStateVisible(4, 'terminal', false));
      results.push('terminal-4');
    }

    if (results.length === 4) {
      // Switch target
      const {priorityTargetKillHero} = yield select(getState);
      if (!priorityTargetKillHero) {
        yield put(setMoveTarget(TARGET_ENTRANCE_TOKEN));
      }
      // Enable escaping
      yield put(enableEscape());
      // Switch deployment to the one closest to entrance
      yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN_N));
      break;
    }
  }
}

function* handleHeroesDeparted(): Generator<*, *, *> {
  yield take(SET_REBEL_ESCAPED);
  // End game with rebel victory
  yield put(displayModal('REBEL_VICTORY'));
  track('drawnIn', 'victory', 'escaped');
}

function* handleHeroesWounded(): Generator<*, *, *> {
  while (true) {
    yield take(WOUND_REBEL_HERO);
    const allWounded = yield select(getAreAllHeroesWounded);
    if (allWounded) {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      track('drawnIn', 'defeat', 'wounded');
      break;
    }
    const isOneHeroLeft = yield select(getIsOneHeroLeft);
    if (isOneHeroLeft) {
      // PRIORITY TARGET SWITCH
      yield put(createAction('DRAWN_IN_PRIORITY_TARGET_KILL_HERO', true));
      yield put(setAttackTarget(TARGET_REMAINING));
      yield put(setMoveTarget(TARGET_REMAINING));
    }
  }
}

// REQUIRED SAGA
function* handleStatusPhaseBegin(): Generator<*, *, *> {
  while (true) {
    yield take(STATUS_PHASE_BEGIN);

    // Change deployment based on if terminals 2 through 4 are active
    const mapStates = yield select(getMapStates);
    const results = [];
    if (!mapStates['terminal-2'].activated) {
      results.push('terminal-2');
    }
    if (!mapStates['terminal-3'].activated) {
      results.push('terminal-3');
    }
    if (!mapStates['terminal-4'].activated) {
      results.push('terminal-4');
    }

    const randomNumber = random(0, results.length - 1);
    const randomResult = results[randomNumber];

    if (randomResult === 'terminal-2') {
      yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN_W));
    } else if (randomResult === 'terminal-3') {
      yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN_S));
    } else if (randomResult === 'terminal-4') {
      yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN_E));
    }

    yield put(statusPhaseBeginDone());
  }
}

// REQUIRED SAGA
function* handleRoundEnd(): Generator<*, *, *> {
  while (true) {
    yield take(STATUS_PHASE_END_ROUND_EFFECTS);
    const currentRound = yield select(getCurrentRound);

    // Subdue event here
    yield call(handleSubdueEvent);

    // Raise alarms event
    if (currentRound === 5) {
      yield call(helperEventModal, {
        story: REFER_CAMPAIGN_GUIDE,
        text: [
          'The threat will be increased by 3 at the beginning of each status phase from now on.',
        ],
        title: 'Raise the Alarms',
      });
      yield put(setExtraThreatIncrease(3));
    }

    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(
    helperInitialSetup,
    'E-Web Engineer, {ELITE}Elite Imperial Officer{END}, Stormtrooper (2)'
  );
  yield call(helperMissionBriefing, [
    'Terminals represent power stations. Rebel figures can attack a power station (Health: 8, Defense: 1 {BLOCK}) to destroy it.',
    'Doors are locked to heroes. A hero can interact ({STRENGTH} or {TECH}) to open it.',
    'When a hero withdraws, he is incapacitated instead. He only receives 1 action and can only move with that action.',
  ]);
  yield put(missionSpecialSetupDone());
}

/*
Priority target definitions:
1) Initial is closest unwounded, move is closest power station
2) Once all power stations down, move is the entrance token
*/

export function* drawnIn(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
  yield put(setMoveTarget(TARGET_POWER_STATION));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN_S));

  yield all([
    fork(handleSpecialSetup),
    fork(handleArrivalEvent),
    fork(handlePowerStationsDestroyed),
    fork(handleHeroesDeparted),
    fork(handleHeroesWounded),
    fork(handleStatusPhaseBegin),
    fork(handleRoundEnd),
  ]);

  track('missionStart', 'drawnIn');
  yield put(missionSagaLoadDone());
}
