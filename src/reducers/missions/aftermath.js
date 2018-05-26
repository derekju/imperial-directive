// @flow

import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {
  getCurrentRound,
  MISSION_SPECIAL_SETUP,
  missionSpecialSetupDone,
  SET_MAP_STATE_ACTIVATED,
  setAttackTarget,
  setDeploymentPoint,
  setMapStateActivated,
  setMapStateVisible,
  setMoveTarget,
  STATUS_PHASE_END_ROUND_EFFECTS,
  statusPhaseEndRoundEffectsDone,
} from '../mission';
import {REFER_CAMPAIGN_GUIDE, TARGET_HERO_CLOSEST_UNWOUNDED} from './constants';
import createAction from '../createAction';
import {displayModal} from '../modal';
import handleHeroesWounded from './sharedSagas/handleHeroesWounded';
import handleStatusPhaseBegin from './sharedSagas/handleStatusPhaseBegin';
import helperCheckMapStateActivations from './helpers/helperCheckMapStateActivations';
import helperChoiceModal from './helpers/helperChoiceModal';
import helperDeploy from './helpers/helperDeploy';
import helperEventModal from './helpers/helperEventModal';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import {missionSagaLoadDone} from '../app';
import type {StateType} from '../types';
import track from '../../lib/track';

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
      track('aftermath', 'lockdown', 'triggered');
      yield put(createAction('AFTERMATH_END_ROUND_EFFECTS', true));
      // Ok, this is the round the rebels opened the door so wait until end of round to trigger
      yield take(STATUS_PHASE_END_ROUND_EFFECTS);
      // Pick which one we'll do and then do it
      const answer = yield call(
        helperChoiceModal,
        'Is there a rebel figure west of the door?',
        'Lockdown'
      );
      if (answer === 'yes') {
        track('aftermath', 'lockdown', 'rebelWest');
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
        track('aftermath', 'lockdown', 'terminalHealth');
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
      track('aftermath', 'fortified', 'triggered');
      yield call(
        helperDeploy,
        'Fortified',
        REFER_CAMPAIGN_GUIDE,
        ['An E-Web Engineer, Stormtrooper group, and an Imperial Officer will now be deployed.'],
        ['eWebEngineer', 'Deploy to the Yellow deployment point in the Atrium. The figure also becomes focused.'],
        ['stormtrooper', 'Deploy to the right side of the Storage room.'],
        ['imperialOfficer', 'Deploy to the right side of the Storage room.'],
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
    if (type === 'terminal' && value === true) {
      track('aftermath', 'interaction', 'terminal', id);
      yield put(setMapStateVisible(id, type, false));

      if (id === 2) {
        // PRIORITY TARGET SWITCH #3
        const {priorityTargetKillHero} = yield select(getState);
        if (!priorityTargetKillHero) {
          yield put(setMoveTarget(TARGET_NEAREST_TERMINAL));
        }
      }
    }
  }
}

function* handleTerminalsDestroyed(): Generator<*, *, *> {
  while (true) {
    yield take(SET_MAP_STATE_ACTIVATED);
    const allActivated = yield call(
      helperCheckMapStateActivations,
      ['terminal-1', 'terminal-2', 'terminal-3', 'terminal-4'],
      4
    );
    // Now check all 4 terminals, if they are activated, then game over for rebels
    if (allActivated) {
      yield put(displayModal('REBEL_VICTORY'));
      track('aftermath', 'victory', 'terminals');
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

    if (currentRound === 6) {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      track('aftermath', 'defeat', 'round');
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
  yield call(helperInitialSetup, ['imperialOfficer', 'probeDroid', 'stormtrooper']);
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
    fork(handleHeroesWounded('aftermath', 'AFTERMATH_PRIORITY_TARGET_KILL_HERO')),
    fork(handleStatusPhaseBegin),
    fork(handleRoundEnd),
  ]);

  track('missionStart', 'aftermath');
  yield put(missionSagaLoadDone());
}
