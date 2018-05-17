// @flow

import {
  ACTIVATION_PHASE_BEGIN,
  getCurrentRound,
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
import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {
  DEFEAT_IMPERIAL_FIGURE,
  getLastDeployedGroupOfId,
  SET_IMPERIAL_GROUP_ACTIVATED,
  setImperialUnitHpBuff,
  silentSetImperialGroupActivated
} from '../imperials';
import {REFER_CAMPAIGN_GUIDE, TARGET_HERO_CLOSEST_UNWOUNDED} from './constants';
import createAction from '../createAction';
import {displayModal} from '../modal';
import handleHeroesWounded from './sharedSagas/handleHeroesWounded';
import handleStatusPhaseBegin from './sharedSagas/handleStatusPhaseBegin';
import helperDeploy from './helpers/helperDeploy';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import helperShowInterruptedGroup from './helpers/helperShowInterruptedGroup';
import {missionSagaLoadDone} from '../app';
import type {StateType} from '../types';
import track from '../../lib/track';

// Constants

const TARGET_WEISS = 'General Weiss';
const TARGET_CLEARING = 'the entrance to the Clearing';

const DEPLOYMENT_POINT_GREEN = 'The northern green deployment point';
const DEPLOYMENT_POINT_RED = 'The red deployment point closest to General Weiss';

// Types

export type DesperateHourStateType = {
  missionState: number,
  priorityTargetKillHero: boolean,
};
// State

const initialState = {
  missionState: 0,
  priorityTargetKillHero: false,
};

export default (state: DesperateHourStateType = initialState, action: Object) => {
  switch (action.type) {
    case 'DESPERATE_HOUR_PRIORITY_TARGET_KILL_HERO':
      return {
        ...state,
        priorityTargetKillHero: action.payload,
      };
    case 'DESPERATE_HOUR_MISSION_STATE':
      return {
        ...state,
        missionState: action.payload.missionState,
      };
    default:
      return state;
  }
};

// Selectors

const getState = (state: StateType) => state.desperateHour;
export const getDesperateHourGoalText = (state: StateType): string[] => {
  let goals = [];

  if (state.desperateHour.missionState === 0) {
    goals = goals.concat([
      '{BOLD}Current Goal:{END}',
      'Open a door to the Hanger (tile 19A).',
      '{BREAK}',
    ]);
  } else if (state.desperateHour.missionState === 1) {
    goals = goals.concat([
      '{BOLD}Current Goal:{END}',
      'Defeat {ELITE}General Weiss{END}.',
      '{BREAK}',
    ]);
  } else if (state.desperateHour.missionState === 2) {
    goals = goals.concat([
      '{BOLD}Current Goal:{END}',
      'Enter the Clearing (tile 06B).',
      '{BREAK}',
    ]);
  } else if (state.desperateHour.missionState === 3) {
    goals = goals.concat([
      '{BREAK}',
      '{BOLD}General Weiss:{END}',
      '{ELITE}Weiss{END} performs 1 action after every Imperial turn.',
      '{BREAK}',
      '{BOLD}Doors:{END}',
      'Locked. Any figure can attack to open (Health: 10, Defense: 2 {BLOCK}).',
      '{BREAK}',
    ]);
  }

  if (state.desperateHour.missionState < 2) {
    goals = goals.concat([
      '{BOLD}Doors:{END}',
      'Locked. Rebel figures can attack doors 1 or 2 to open them (Health 6).',
      '{BREAK}',
    ]);
  } else {
    goals = goals.concat([
      '{BOLD}AT-ST:{END}',
      'Gains "Epic Arsenel" from General Weiss\' ability card.',
      'Also gains one action at the end of each hero\'s turn.',
      '{BREAK}',
    ]);
  }

  goals = goals.concat([
    '{BOLD}Massive Figures:{END}',
    'Can move through and occupy interior spaces.',
    '{BREAK}',
  ]);

  return goals;
};

// Sagas

function* handleNotSoFast(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if ([1, 2].includes(id) && type === 'door' && value === true) {
      track('desperateHour', 'notSoFast', 'triggered');

      yield call(
        helperDeploy,
        REFER_CAMPAIGN_GUIDE,
        [
          'Deploy {ELITE}General Weiss{END} to the yellow point.',
          'Defeat {ELITE}General Weiss{END} to progress the mission.',
        ],
        'Not So Fast',
        ['generalWeiss']
      );

      yield put(createAction('DESPERATE_HOUR_MISSION_STATE', {missionState: 1}));
      yield put(setMoveTarget(TARGET_WEISS));

      // We're done
      break;
    }
  }
}

function* handleRespite(): Generator<*, *, *> {
  while (true) {
    const action = yield take(DEFEAT_IMPERIAL_FIGURE);
    const {group} = action.payload;
    const {missionState} = yield select(getState);
    if (group.id === 'generalWeiss' && missionState === 1) {
      track('desperateHour', 'respite', 'triggered');

      yield call(
        helperDeploy,
        REFER_CAMPAIGN_GUIDE,
        [
          'All doors will now be opened.',
          'Deploy an {ELITE}Elite Imperial Officer{END}, Stormtrooper group, and {ELITE}Elite Royal Guard{END} group to the Warehouse (tile 24B).',
          'Deploy the {ELITE}AT-ST{END} to the yellow point as a Rebel controlled figure. The {ELITE}AT-ST{END} gains "Epic Arsenel" from {ELITE}General Weiss\'{END} ability card.',
          'The {ELITE}AT-ST{END} performs one action after each hero\'s activation.',
          'Reach the Clearing (tile 06B) to progress the mission.',
        ],
        'Respite',
        ['imperialOfficerElite', 'stormtrooper', 'royalGuardElite']
      );

      yield put(setMapStateActivated(1, 'door', true));
      yield put(setMapStateActivated(2, 'door', true));
      yield put(setMapStateActivated(3, 'door', true));
      yield put(setMapStateActivated(4, 'door', true));
      yield put(createAction('DESPERATE_HOUR_MISSION_STATE', {missionState: 2}));
      yield put(setMoveTarget(TARGET_CLEARING));

      // We're done
      break;
    }
  }
}

function* handleClearingEntered(): Generator<*, *, *> {
  yield take('DESPERATE_HOUR_ENTERED_CLEARING');
  track('desperateHour', 'bitterEnd', 'triggered');

  yield call(
    helperDeploy,
    REFER_CAMPAIGN_GUIDE,
    [
      'Deploy {ELITE}General Weiss{END} to the bottom left corner of the Canyon (tile 02B).',
      'Deploy an {ELITE}Elite E-Web Engineer{END} to the left red point and {ELITE}Elite Trandoshan Hunter{END} group to top red point.',
      'All doors will now close and are locked. Any figure can attack a door to open it (Health: 10, Defense: 2 {BLOCK})',
      '{ELITE}General Weiss{END} gains +10 Health. He performs 1 action after each Imperial group activation.',
      'Defeat {ELITE}General Weiss{END} to win!',
    ],
    'The Bitter End',
    ['generalWeiss', 'eWebEngineerElite', 'trandoshanHunterElite']
  );

  yield put(setMapStateActivated(1, 'door', false));
  yield put(setMapStateActivated(2, 'door', false));
  yield put(setMapStateActivated(3, 'door', false));
  yield put(setMapStateActivated(4, 'door', false));
  yield put(setMapStateInteractable(3, 'door', true));
  yield put(setMapStateInteractable(4, 'door', true));

  yield put(setImperialUnitHpBuff('generalWeiss', 10));
  yield put(updateRebelVictory('When General Weiss is defeated'));
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_RED));
  yield put(setMoveTarget(TARGET_WEISS));
  yield put(createAction('DESPERATE_HOUR_MISSION_STATE', {missionState: 3}));


  // Manually set him as activated so he doesn't activate as normal after this time
  const group = yield select(getLastDeployedGroupOfId, 'generalWeiss');
  yield put(silentSetImperialGroupActivated(group));

  yield fork(handleWeissActivations);
}

function* handleWeissActivations(): Generator<*, *, *> {
  while (true) {
    yield take(SET_IMPERIAL_GROUP_ACTIVATED);
    yield call(helperShowInterruptedGroup, 'generalWeiss');
  }
}

function* handleWeissKilled(): Generator<*, *, *> {
  while (true) {
    const action = yield take(DEFEAT_IMPERIAL_FIGURE);
    const {group} = action.payload;
    const {missionState} = yield select(getState);
    if (group.id === 'generalWeiss' && missionState === 3) {
      yield put(displayModal('REBEL_VICTORY'));
      track('desperateHour', 'victory', 'generalWeiss');
      break;
    }
  }
}

function* handleRoundStart(): Generator<*, *, *> {
  while (true) {
    yield take(ACTIVATION_PHASE_BEGIN);
    const state = yield select(getState);
    const {missionState} = state;
    // Check if we need to manually exhaust Weiss
    if (missionState === 3) {
      const group = yield select(getLastDeployedGroupOfId, 'generalWeiss');
      yield put(silentSetImperialGroupActivated(group));
    }
  }
}

// REQUIRED SAGA
function* handleRoundEnd(): Generator<*, *, *> {
  while (true) {
    yield take(STATUS_PHASE_END_ROUND_EFFECTS);
    const currentRound = yield select(getCurrentRound);

    if (currentRound === 8) {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      track('desperateHour', 'defeat', 'round');
      break;
    }

    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(helperInitialSetup, 'Royal Guard, {ELITE}Stormtrooper{END}');
  yield call(helperMissionBriefing, [
    'Doors are locked. A Rebel figure can attack Doors 1 or 2 (Health: 6) to open it.',
    'A massive figure can move through and occupy interior spaces.',
  ]);
  yield put(missionSpecialSetupDone());
}

/*
Priority target definitions:
1) Initial attack is default, move is default
2) Once Weiss is out, move is to protect him
3) Once Weiss is gone, move to protect Clearing
4) Once Weiss is back, move to protect him
*/
export function* desperateHour(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
  yield put(setMoveTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN));

  yield all([
    fork(handleSpecialSetup),
    fork(handleNotSoFast),
    fork(handleRespite),
    fork(handleClearingEntered),
    fork(handleWeissKilled),
    fork(handleHeroesWounded('desperateHour', 'DESPERATE_HOUR_PRIORITY_TARGET_KILL_HERO')),
    fork(handleStatusPhaseBegin),
    fork(handleRoundStart),
    fork(handleRoundEnd),
  ]);

  track('missionStart', 'desperateHour');
  yield put(missionSagaLoadDone());
}
