// @flow

import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {
  ACTIVATE_IMPERIAL_GROUP,
  OPTIONAL_DEPLOYMENT_DONE,
  optionalDeployment,
  setImperialUnitHpBuff,
} from '../imperials';
import {getAreAllHeroesWounded, getIsOneHeroLeft, WOUND_REBEL_HERO} from '../rebels';
import {
  ACTIVATION_PHASE_BEGIN,
  getCurrentThreat,
  increaseThreat,
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
  updateRebelVictory,
} from '../mission';
import {getMissionThreat, missionSagaLoadDone} from '../app';
import {REFER_CAMPAIGN_GUIDE, TARGET_HERO_CLOSEST_UNWOUNDED, TARGET_REMAINING} from './constants';
import createAction from '../createAction';
import {displayModal} from '../modal';
import handleImperialKilledToWin from './sharedSagas/handleImperialKilledToWin';
import handleStatusPhaseBegin from './sharedSagas/handleStatusPhaseBegin';
import helperChoiceModal from './helpers/helperChoiceModal';
import helperDeploy from './helpers/helperDeploy';
import helperEventModal from './helpers/helperEventModal';
import helperIncreaseThreat from './helpers/helperIncreaseThreat';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import helperShowInterruptedGroup from './helpers/helperShowInterruptedGroup';
import type {StateType} from '../types';
import track from '../../lib/track';

// Constants

const TARGET_SZARK = 'Szark';
const DEPLOYMENT_POINT_GREEN = 'The green deployment point closest to the most heroes';

// Types

export type HighMoonStateType = {
  callOutSzarkDone: boolean,
  priorityTargetKillHero: boolean,
};

// State

const initialState = {
  callOutSzarkDone: false,
  priorityTargetKillHero: false,
};

export default (state: HighMoonStateType = initialState, action: Object) => {
  switch (action.type) {
    case 'HIGH_MOON_SET_CALL_OUT_SZARK':
      return {
        ...state,
        callOutSzarkDone: true,
      };
    case 'HIGH_MOON_PRIORITY_TARGET_KILL_HERO':
      return {
        ...state,
        priorityTargetKillHero: action.payload,
      };
    default:
      return state;
  }
};

// Selectors

const getState = (state: StateType) => state.highMoon;
export const getHighMoonGoalText = (state: StateType): string[] => {
  let goals = [];

  if (!state.highMoon.callOutSzarkDone) {
    goals = goals.concat([
      '{BOLD}Current Goal:{END}',
      'Jyn can call out Szark by interacting with the comlink (Rebel mission token).',
      '{BREAK}',
      '{BOLD}Doors:{END}',
      'Doors are locked.',
    ]);
  } else {
    goals = goals.concat([
      '{BOLD}Szark:{END}',
      `Szark gains an extra ${state.app.missionThreat * 2} Health.`,
      '{BREAK}',
      '{BOLD}When Szark activates:{END}',
      `Imperials may spend 2 threat for Szark to recover ${state.app.missionThreat} {DAMAGE}.`,
      '{BREAK}',
      '{BOLD}Start of Round:{END}',
      `Imperials may spend 2 threat for Szark to recover ${state.app.missionThreat} {DAMAGE}.`,
    ]);
  }

  return goals;
};

// Sagas

function* handleGunFightEvent(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'rebel' && value === true) {
      track('highMoon', 'gunFight', 'triggered');
      // First part
      yield call(
        helperDeploy,
        'Gun Fight',
        REFER_CAMPAIGN_GUIDE,
        [
          'The door will now open.',
          'Szark (a Trandoshan Hunter) and an {ELITE}Elite Trandoshan Hunter{END} group will now be deployed.',
        ],
        ['szark', 'Deploy to the yellow point.'],
        ['trandoshanHunterElite', 'Deploy one unit to each of the red points.']
      );
      yield put(setMapStateActivated(1, 'door', true));
      yield put(setMapStateVisible(1, 'rebel', false));
      // Need to manually set Szark's HP buff
      const missionThreat = yield select(getMissionThreat);
      yield put(setImperialUnitHpBuff('szark', missionThreat * 2));

      // Second part
      const answer = yield call(
        helperChoiceModal,
        'Jyn tests {INSIGHT}. Did she pass?',
        'Gun Fight'
      );
      if (answer === 'yes') {
        yield call(helperEventModal, {
          story: 'Jyn catches Szark unawares...',
          text: ['Jyn interrupts to perform an attack targeting Szark.'],
          title: 'Gun Fight',
        });
      } else {
        yield call(helperEventModal, {
          story: 'Szark catches Jyn unawares...',
          text: [
            'Szark interrupts to perform an attack targeting Jyn.',
            "Szark's AI card will now be shown.",
          ],
          title: 'Gun Fight',
        });

        // Need to show Szark's AI panel now
        yield call(helperShowInterruptedGroup, 'szark');
      }

      yield call(helperEventModal, {
        text: [
          `Szark gets ${missionThreat * 2} extra Health.`,
          'If the Rebels defeat Szark, they win.',
        ],
        title: 'High Moon',
      });

      yield put(createAction('HIGH_MOON_SET_CALL_OUT_SZARK', true));
      yield put(updateRebelVictory('Defeat Szark'));

      const state = yield select(getState);
      const {priorityTargetKillHero} = state;
      if (!priorityTargetKillHero) {
        yield put(setMoveTarget(TARGET_SZARK));
      }

      // We're done
      break;
    }
  }
}

function* checkSzarkHealth(): Generator<*, *, *> {
  const missionThreat = yield select(getMissionThreat);
  const currentThreat = yield select(getCurrentThreat);
  if (currentThreat < 2) {
    return;
  }

  const answer = yield call(
    helperChoiceModal,
    `Has Szark taken at least ${missionThreat} {DAMAGE}?`,
    'Szark'
  );
  if (answer === 'yes') {
    yield call(helperEventModal, {
      text: [`Two threat was used to heal Szark for ${missionThreat} {DAMAGE}`],
      title: 'Szark',
    });
    yield put(increaseThreat(-2));
  }
}

function* handleSzarkActivation(): Generator<*, *, *> {
  while (true) {
    const action = yield take(ACTIVATE_IMPERIAL_GROUP);
    const {group} = action.payload;
    if (group.id === 'szark') {
      yield call(checkSzarkHealth);
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
      track('highMoon', 'defeat', 'wounded');
      break;
    }
    const isOneHeroLeft = yield select(getIsOneHeroLeft);
    if (isOneHeroLeft) {
      // SWITCH TARGET
      yield put(createAction('HIGH_MOON_PRIORITY_TARGET_KILL_HERO', true));
      yield put(setAttackTarget(TARGET_REMAINING));
      yield put(setMoveTarget(TARGET_REMAINING));
    }
  }
}

function* handleRoundStart(): Generator<*, *, *> {
  while (true) {
    yield take(ACTIVATION_PHASE_BEGIN);
    const state = yield select(getState);
    const {callOutSzarkDone} = state;
    // Check if we need to heal Szark
    if (callOutSzarkDone) {
      yield call(checkSzarkHealth);
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
  yield call(helperInitialSetup, ['eWebEngineer', 'imperialOfficer', 'nexuElite', 'stormtrooper']);
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
    'The door is locked.',
    'The Rebel mission token is a comlink. Jyn can interact with it to call out Szark.',
  ]);
  yield put(missionSpecialSetupDone());
}

/*
Priority target definitions:
1) Initial attack is default, move is closest hero
2) At any point if heroes - 1 are wounded, attack and move are the last remaining hero
*/
export function* highMoon(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
  yield put(setMoveTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN));

  yield all([
    fork(handleSpecialSetup),
    fork(handleGunFightEvent),
    fork(handleSzarkActivation),
    fork(handleImperialKilledToWin('szark', 'highMoon')),
    fork(handleHeroesWounded),
    fork(handleRoundStart),
    fork(handleStatusPhaseBegin),
    fork(handleRoundEnd),
  ]);

  track('missionStart', 'highMoon');
  yield put(missionSagaLoadDone());
}
