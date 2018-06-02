// @flow

import {
  ACTIVATION_PHASE_BEGIN,
  getCurrentRound,
  getCurrentThreat,
  increaseThreat,
  MISSION_SPECIAL_SETUP,
  missionSpecialSetupDone,
  SET_MAP_STATE_ACTIVATED,
  setAttackTarget,
  setDeploymentPoint,
  setMapStateActivated,
  setMoveTarget,
  STATUS_PHASE_END_ROUND_EFFECTS,
  statusPhaseEndRoundEffectsDone,
  updateRebelVictory,
} from '../mission';
import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {
  DEFEAT_IMPERIAL_FIGURE,
  getLastDeployedGroupOfId,
  setImperialUnitHpBuff,
  silentSetImperialGroupActivated,
} from '../imperials';
import {getRosterOfType, SET_REBEL_ACTIVATED} from '../rebels';
import {REFER_CAMPAIGN_GUIDE, TARGET_HERO_CLOSEST_UNWOUNDED} from './constants';
import createAction from '../createAction';
import {displayModal} from '../modal';
import handleHeroesWounded from './sharedSagas/handleHeroesWounded';
import handleStatusPhaseBegin from './sharedSagas/handleStatusPhaseBegin';
import helperDeploy from './helpers/helperDeploy';
import helperEventModal from './helpers/helperEventModal';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import helperShowInterruptedGroup from './helpers/helperShowInterruptedGroup';
import {missionSagaLoadDone} from '../app';
import type {StateType} from '../types';
import track from '../../lib/track';

// Constants

const TARGET_DOOR_1 = 'door 1';
const TARGET_DOOR_2 = 'door 2';
const TARGET_DOOR_3_4 = 'door 3 or 4 (whichever nearest)';

const DEPLOYMENT_POINT_GREEN = 'The green deployment point next to Door 1';
const DEPLOYMENT_POINT_BLUE = 'The blue deployment point';
const DEPLOYMENT_POINT_YELLOW = 'The yellow deployment point in the Medical Center';

// Types

export type LastStandStateType = {
  doorState: number,
  priorityTargetKillHero: boolean,
};

// State

const initialState = {
  doorState: 0,
  priorityTargetKillHero: false,
};

export default (state: LastStandStateType = initialState, action: Object) => {
  switch (action.type) {
    case 'LAST_STAND_PRIORITY_TARGET_KILL_HERO':
      return {
        ...state,
        priorityTargetKillHero: action.payload,
      };
    case 'LAST_STAND_DOOR_OPEN':
      return {
        ...state,
        doorState: action.payload.doorNumber,
      };
    default:
      return state;
  }
};

// Selectors

const getState = (state: StateType) => state.lastStand;
export const getLastStandGoalText = (state: StateType): string[] => {
  let goals = [];

  if (state.lastStand.doorState === 0) {
    goals = goals.concat(['{BOLD}Current Goal:{END}', 'Open the first door.', '{BREAK}']);
  } else if (state.lastStand.doorState === 1) {
    goals = goals.concat(['{BOLD}Current Goal:{END}', 'Open the second door.', '{BREAK}']);
  } else if (state.lastStand.doorState === 2) {
    goals = goals.concat([
      '{BOLD}Current Goal:{END}',
      'Open the door to the Command Center.',
      '{BREAK}',
    ]);
  }

  goals = goals.concat([
    '{BOLD}Doors:{END}',
    'Locked. Rebel figures can attack to open or a hero can interact ({TECH}) to open.',
    'Health: 5, Defense: 1 black die',
  ]);

  if (state.lastStand.doorState === 3) {
    goals = goals.concat([
      '{BREAK}',
      '{BOLD}Darth Vader:{END}',
      "{ELITE}Vader{END} activates after every heroes' turn.",
      '{BREAK}',
      'He cannot receive conditions.',
      '{BREAK}',
      'If an attack against {ELITE}Vader{END} has the potential to do more than 5 {DAMAGE}, {ELITE}Vader{END} should use 2 threat to add +2 {BLOCK} to the attack.',
      '{BREAK}',
    ]);
  }

  return goals;
};

// Sagas

function* handleWelcomingPartyEvent(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'door' && value === true) {
      track('lastStand', 'welcomingParty', 'triggered');

      yield call(
        helperDeploy,
        'Welcoming Party',
        REFER_CAMPAIGN_GUIDE,
        ['An {ELITE}Elite Royal Guard{END} group and Probe Droid will now be deployed.'],
        ['royalGuardElite', 'Deploy to the right edge of the Warehouse.'],
        ['probeDroid', 'Deploy to the right edge of the Warehouse.']
      );

      yield put(createAction('LAST_STAND_DOOR_OPEN', {doorNumber: 1}));
      yield put(setDeploymentPoint(DEPLOYMENT_POINT_BLUE));
      yield put(setMoveTarget(TARGET_DOOR_2));

      // We're done
      break;
    }
  }
}

function* handleDefensesBreachedEvent(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 2 && type === 'door' && value === true) {
      track('lastStand', 'defensesBreached', 'triggered');

      yield call(
        helperDeploy,
        'Defenses Breached',
        REFER_CAMPAIGN_GUIDE,
        ['An Imperial Officer, Probe Droid, and a Stormtrooper group will now be deployed.'],
        ['imperialOfficer', 'Deploy to the top edge of the Medical Center.'],
        ['probeDroid', 'Deploy to the top edge of the Medical Center.'],
        ['stormtrooper', 'Deploy to the right edge of the Reception Chamber.']
      );

      yield put(createAction('LAST_STAND_DOOR_OPEN', {doorNumber: 2}));
      yield put(setDeploymentPoint(DEPLOYMENT_POINT_YELLOW));
      yield put(setMoveTarget(TARGET_DOOR_3_4));

      // We're done
      break;
    }
  }
}

function* handleEndOfTheLineEvent(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if ((id === 3 || id === 4) && type === 'door' && value === true) {
      track('lastStand', 'endOfTheLine', 'triggered');

      yield call(
        helperDeploy,
        'End of the Line',
        REFER_CAMPAIGN_GUIDE,
        [
          'Deploy {ELITE}Darth Vader{END} to the red point. {ELITE}Darth Vader{END} gets +8 Health.',
          "Instead of activating as normal, {ELITE}Darth Vader{END} performs 1 action after each hero's activation.",
          'He also cannot receive conditions.',
          'He can also spend 2 threat to apply +2 {BLOCK} to defense results.',
          'Door 1 and Door 2 will now close.',
        ],
        ['darthVader', 'Deploy to the red point.']
      );

      yield put(setMapStateActivated(1, 'door', false));
      yield put(setMapStateActivated(2, 'door', false));
      yield put(setImperialUnitHpBuff('darthVader', 8));
      yield put(updateRebelVictory('When Darth Vader is defeated'));
      yield put(createAction('LAST_STAND_DOOR_OPEN', {doorNumber: 3}));
      yield put(setMoveTarget(TARGET_HERO_CLOSEST_UNWOUNDED));

      // Manually set him as activated so he doesn't activate as normal after this time
      const group = yield select(getLastDeployedGroupOfId, 'darthVader');
      yield put(silentSetImperialGroupActivated(group));

      yield fork(handleVaderActivations);

      // We're done
      break;
    }
  }
}

function* handleVaderActivations(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_REBEL_ACTIVATED);
    const {id} = action.payload;
    const roster = yield select(getRosterOfType, 'hero');
    // Only interrupt if a hero was activated
    if (roster.includes(id)) {
      yield call(helperShowInterruptedGroup, 'darthVader');
    }
  }
}

function* handleVaderBlockForThreat(): Generator<*, *, *> {
  while (true) {
    yield take('LAST_STAND_VADER_BLOCK');
    // Check if imperials even have 2 threat, if not, fail this operation
    const currentThreat = yield select(getCurrentThreat);
    if (currentThreat < 2) {
      yield call(helperEventModal, {
        text: ['{ELITE}Darth Vader{END} does not have 2 threat to utilize.'],
        title: 'Last Stand',
      });
    } else {
      yield put(increaseThreat(-2));
      yield call(helperEventModal, {
        text: ['{ELITE}Darth Vader{END} gains 2 {BLOCK} for the next attack.'],
        title: 'Last Stand',
      });
    }
  }
}

function* handleVaderKilled(): Generator<*, *, *> {
  while (true) {
    const action = yield take(DEFEAT_IMPERIAL_FIGURE);
    const {group} = action.payload;
    if (group.id === 'darthVader') {
      yield put(displayModal('REBEL_VICTORY'));
      track('lastStand', 'victory', 'darthVader');
      break;
    }
  }
}

function* handleRoundStart(): Generator<*, *, *> {
  while (true) {
    yield take(ACTIVATION_PHASE_BEGIN);
    const state = yield select(getState);
    const {doorState} = state;
    // Check if we need to manually exhaust Vader
    if (doorState === 3) {
      const group = yield select(getLastDeployedGroupOfId, 'darthVader');
      yield put(silentSetImperialGroupActivated(group));
    }
  }
}

// REQUIRED SAGA
function* handleRoundEnd(): Generator<*, *, *> {
  while (true) {
    yield take(STATUS_PHASE_END_ROUND_EFFECTS);
    const currentRound = yield select(getCurrentRound);

    if (currentRound === 12) {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      track('lastStand', 'defeat', 'round');
      break;
    }

    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(helperInitialSetup, ['eWebEngineerElite', 'royalGuard', 'stormtrooper']);
  yield call(helperMissionBriefing, [
    'Doors are locked. A Rebel figure can attack a door (Health: 5, Defense: 1 black die), or a hero can interact with a door ({TECH}) to open it.',
  ]);
  yield put(missionSpecialSetupDone());
}

/*
Priority target definitions:
1) Initial attack is default, move is door 1
2) Once door 1 open, move is door 2
3) Once door 2 open, move is door 3 or 4 (whichever closer)
4) Finally, move is the closest unwounded hero
*/
export function* lastStand(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
  yield put(setMoveTarget(TARGET_DOOR_1));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN));

  yield all([
    fork(handleSpecialSetup),
    fork(handleWelcomingPartyEvent),
    fork(handleDefensesBreachedEvent),
    fork(handleEndOfTheLineEvent),
    fork(handleVaderBlockForThreat),
    fork(handleVaderKilled),
    fork(handleHeroesWounded('lastStand', 'LAST_STAND_PRIORITY_TARGET_KILL_HERO')),
    fork(handleStatusPhaseBegin),
    fork(handleRoundStart),
    fork(handleRoundEnd),
  ]);

  track('missionStart', 'lastStand');
  yield put(missionSagaLoadDone());
}
