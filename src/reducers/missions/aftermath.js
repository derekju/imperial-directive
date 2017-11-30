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
  setMapStateActivated,
  setMoveTarget,
  statusPhaseEndRoundEffectsDone,
  STATUS_PHASE_END_ROUND_EFFECTS,
} from '../mission';
import {REFER_CAMPAIGN_GUIDE, TARGET_HERO_CLOSEST_UNWOUNDED, TARGET_REMAINING} from './constants';
import createAction from '../createAction';
import {displayModal} from '../modal';
import helperDeploy from './helpers/helperDeploy';
import helperEventModal from './helpers/helperEventModal';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import {missionSagaLoadDone} from '../app';
import type {StateType} from '../types';
import waitForModal from '../../sagas/waitForModal';

// Constants

const TARGET_DOOR = 'the door';
const TARGET_TERMINAL_2 = 'terminal 2';
const TARGET_NEAREST_TERMINAL = 'the nearest active terminal';

const DEPLOYMENT_POINT_GREEN = 'The green deployment point';
const DEPLOYMENT_POINT_RED =
  'If Lockdown option 2 was chosen: the red deployment point. Otherwise, the green deployment point';

// Types

export type AftermathStateType = {
  priorityTargetKillHero: boolean,
  requireEndRoundEffects: boolean,
  terminalHealth: number,
  wasDoorForceClosed: boolean,
};

// State

const initialState = {
  priorityTargetKillHero: false,
  requireEndRoundEffects: false,
  terminalHealth: 4,
  wasDoorForceClosed: false,
};

export default (state: AftermathStateType = initialState, action: Object) => {
  switch (action.type) {
    case 'AFTERMATH_END_ROUND_EFFECTS':
      return {
        ...state,
        requireEndRoundEffects: action.payload,
      };
    case 'AFTERMATH_DOOR_FORCE_CLOSED':
      return {
        ...state,
        wasDoorForceClosed: action.payload,
      };
    case 'AFTERMATH_SET_TERMINAL_HEALTH':
      return {
        ...state,
        terminalHealth: action.payload,
      };
    case 'AFTERMATH_PRIORITY_TARGET_KILL_HERO':
      return {
        ...state,
        priorityTargetKillHero: action.payload,
      };
    default:
      return state;
  }
};

// Selectors

const getState = (state: StateType) => state.aftermath;
export const getAftermathGoalText = (state: StateType): string[] => {
  const goals = [
    '{BOLD}Terminal:{END}',
    `Health: ${state.aftermath.terminalHealth}, Defense: 1 {BLOCK}`,
    '(Apply +1 {BLOCK} if the terminal is adjacent to any Imperial figures)',
  ];

  if (state.aftermath.wasDoorForceClosed) {
    goals.push('{BREAK}');
    goals.push('{BOLD}Door:{END}');
    goals.push('Health: 8, Defense: 1 black die');
  }

  return goals;
};

// Sagas

function* handleLockDownEvent(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'door' && value === true) {
      yield put(createAction('AFTERMATH_END_ROUND_EFFECTS', true));
      // Ok, this is the round the rebels opened the door so wait until end of round to trigger
      yield take(STATUS_PHASE_END_ROUND_EFFECTS);
      // Pick which one we'll do and then do it
      yield put(
        displayModal('CHOICE_MODAL', {
          question: 'Is there a rebel figure west of the door?',
          title: 'Lockdown',
        })
      );
      yield call(waitForModal('CHOICE_MODAL'));
      const response = yield take('CHOICE_MODAL_ANSWER');
      const {answer} = response.payload;
      if (answer === 'yes') {
        yield call(helperEventModal, {
          story: 'Sirens blare as the outpost goes into lockdown mode.',
          text: [
            'The door to the Atrium has been closed. A Rebel figure can attack the door (Health: 8, Defense: 1 black die) to open it.',
          ],
          title: 'Lockdown',
        });
        yield put(createAction('AFTERMATH_DOOR_FORCE_CLOSED', true));
        yield put(setMapStateActivated(1, 'door', false));
        yield put(setDeploymentPoint(DEPLOYMENT_POINT_RED));
      } else {
        yield call(helperEventModal, {
          story: 'Sirens blare as the outpost goes into lockdown mode.',
          text: ['Each terminal has 7 Health now instead of 4.'],
          title: 'Lockdown',
        });
        yield put(createAction('AFTERMATH_SET_TERMINAL_HEALTH', 7));
      }

      // We're done
      yield put(createAction('AFTERMATH_END_ROUND_EFFECTS', false));
      yield put(statusPhaseEndRoundEffectsDone());
      break;
    }
  }
}

function* handleFortifiedEvent(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'door' && value === true) {
      yield call(
        helperDeploy,
        REFER_CAMPAIGN_GUIDE,
        [
          'Deploy an E-Web Engineer to the Yellow deployment point in the Atrium. That figure becomes focused.',
          'Deploy a Stormtrooper group and an Imperial Officer to the right side of the Storage room.',
        ],
        'Fortified',
        ['eWebEngineer', 'stormtrooper', 'imperialOfficer']
      );
      // PRIORITY TARGET SWITCH #2
      const {priorityTargetKillHero} = yield select(getState);
      if (!priorityTargetKillHero) {
        yield put(setMoveTarget(TARGET_TERMINAL_2));
      }
      // We're done
      break;
    }
  }
}

function* handleSingleTerminalDestroyed(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 2 && type === 'terminal' && value === true) {
      // PRIORITY TARGET SWITCH #3
      const {priorityTargetKillHero} = yield select(getState);
      if (!priorityTargetKillHero) {
        yield put(setMoveTarget(TARGET_NEAREST_TERMINAL));
      }
      // We're done
      break;
    }
  }
}

function* handleTerminalsDestroyed(): Generator<*, *, *> {
  while (true) {
    yield take(SET_MAP_STATE_ACTIVATED);
    const mapStates = yield select(getMapStates);
    // Now check all 4 terminals, if they are activated, then game over for rebels
    if (
      mapStates['terminal-1'].activated &&
      mapStates['terminal-2'].activated &&
      mapStates['terminal-3'].activated &&
      mapStates['terminal-4'].activated
    ) {
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
      break;
    }
    const isOneHeroLeft = yield select(getIsOneHeroLeft);
    if (isOneHeroLeft) {
      // PRIORITY TARGET SWITCH #4
      yield put(createAction('AFTERMATH_PRIORITY_TARGET_KILL_HERO', true));
      yield put(setAttackTarget(TARGET_REMAINING));
      yield put(setMoveTarget(TARGET_REMAINING));
    }
  }
}

// REQUIRED SAGA
function* handleRoundEnd(): Generator<*, *, *> {
  while (true) {
    yield take(STATUS_PHASE_END_ROUND_EFFECTS);
    const currentRound = yield select(getCurrentRound);

    if (currentRound === 6) {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      // We're done, don't send statusPhaseEndRoundEffects so we stall the game out on purpose
      break;
    }

    const {requireEndRoundEffects} = yield select(getState);
    if (!requireEndRoundEffects) {
      yield put(statusPhaseEndRoundEffectsDone());
    }
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(helperInitialSetup, 'Imperial Officer, Probe Droid, Stormtrooper');
  yield call(helperMissionBriefing, [
    'A Rebel figure can attack a Terminal to destroy it (Health: 4, Defense: 1 {BLOCK}). Apply +1 {BLOCK} if the terminal is adjacent to any Imperial figures.',
    'Imperial figures cannot open doors.',
  ]);
  yield put(missionSpecialSetupDone());
}

/*
Priority target definitions:
1) Initial attack is default, move is door
2) Once door opens, move is terminal 2
3) If terminal 2 is down, move is nearest terminal
4) At any point if heroes - 1 are wounded, attack and move are the last remaining hero
*/
export function* aftermath(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
  yield put(setMoveTarget(TARGET_DOOR));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN));

  yield all([
    fork(handleSpecialSetup),
    fork(handleLockDownEvent),
    fork(handleFortifiedEvent),
    fork(handleSingleTerminalDestroyed),
    fork(handleTerminalsDestroyed),
    fork(handleHeroesWounded),
    fork(handleRoundEnd),
  ]);

  yield put(missionSagaLoadDone());
}
