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
import {getMissionThreat, missionSagaLoadDone} from '../app';
import {
  OPTIONAL_DEPLOYMENT_DONE,
  optionalDeployment,
} from '../imperials';
import {REFER_CAMPAIGN_GUIDE, TARGET_HERO_CLOSEST_UNWOUNDED} from './constants';
import createAction from '../createAction';
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

const TARGET_GREEN_TERMINAL = 'the Green terminal (T1)';
const TARGET_BLUE_TERMINAL = 'the Blue terminal (T2)';
const TARGET_WEAPON_CONSOLE = 'the weapons console';
const TARGET_ENTRANCE = 'the entrance';

const DEPLOYMENT_POINT_GREEN_N = 'The north green deployment point';
const DEPLOYMENT_POINT_GREEN_S = 'The south green deployment point';
const DEPLOYMENT_POINT_GREEN_W = 'The west green deployment point';
const DEPLOYMENT_POINT_GREEN_E = 'The east green deployment point';

// Types

export type FireInTheSkyStateType = {
  blowThisThing: boolean,
  heavySecurity: boolean,
  priorityTargetKillHero: boolean,
  weaponsConsoleSliced: boolean,
};

// State

const initialState = {
  blowThisThing: false,
  heavySecurity: false,
  priorityTargetKillHero: false,
  weaponsConsoleSliced: false,
};

export default (state: FireInTheSkyStateType = initialState, action: Object) => {
  switch (action.type) {
    case 'FIRE_IN_THE_SKY_PRIORITY_TARGET_KILL_HERO':
      return {
        ...state,
        priorityTargetKillHero: action.payload,
      };
    case 'FIRE_IN_THE_SKY_HEAVY_SECURITY_TRIGGERED':
      return {
        ...state,
        heavySecurity: true,
      };
    case 'FIRE_IN_THE_SKY_WEAPON_CONSOLE_SLICED':
      return {
        ...state,
        weaponsConsoleSliced: true,
      };
    case 'FIRE_IN_THE_SKY_BLOW_THING_TRIGGERED':
      return {
        ...state,
        blowThisThing: true,
      };
    default:
      return state;
  }
};

// Selectors

export const getFireInTheSkyGoalText = (state: StateType): string[] => {
  let goals = [];

  const {blowThisThing, heavySecurity, weaponsConsoleSliced} = state.fireInTheSky;
  const {missionThreat} = state.app;

  if (!heavySecurity) {
    goals = goals.concat([
      '{BOLD}Doors:{END}',
      'Are locked. A hero can interact with the green terminal (T1) (2 {TECH}) to open all doors except for the weapons console.',
      '{BREAK}',
    ]);
  } else if (!blowThisThing) {
    goals = goals.concat([
      '{BOLD}Doors:{END}',
      `Are locked. A hero can destroy the blue terminal (Health: ${missionThreat *
        2}, Defense: 2 {BLOCK}) (T2) to open the door (D3) to the weapons console.`,
      '{BREAK}',
    ]);
  }

  if (!weaponsConsoleSliced) {
    goals = goals.concat([
      '{BOLD}Weapons Console:{END}',
      'The red imperial mission token. A hero can interact (2 {TECH} or {INSIGHT}) to slice. Flip the token to the Rebel side.',
      '{BREAK}',
    ]);
  }

  goals = goals.concat([
    '{BOLD}Withdrawn hero:{END}',
    'Withdrawn heroes receive only 1 action and they can only move.',
  ]);

  if (weaponsConsoleSliced) {
    goals = goals.concat([
      '{BREAK}',
      '{BOLD}Departing:{END}',
      'If all heroes are on or adjacent to the entrance, they depart.',
    ]);
  }

  return goals;
};

// Sagas

function getRandomDeploymentPoint() {
  return getRandomItem(DEPLOYMENT_POINT_GREEN_W, DEPLOYMENT_POINT_GREEN_E, DEPLOYMENT_POINT_GREEN_N, DEPLOYMENT_POINT_GREEN_S);
}

function* handleHeavySecurity(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'terminal' && value === true) {
      track('fireInTheSky', 'heavySecurity', 'triggered');

      // Open door 1 and door 2
      yield put(setMapStateActivated(1, 'door', true));
      yield put(setMapStateActivated(2, 'door', true));

      yield call(
        helperDeploy,
        'Heavy Security',
        'Your actions have not gone unnoticed.',
        ['An {ELITE}Elite Imperial Officer{END} and {ELITE}Boba Fett{END} will now be deployed.'],
        ['imperialOfficerElite', 'Deploy to the red point.'],
        ['bobaFett', 'Deploy to the yellow point.']
      );

      yield call(helperIncreaseThreat, 1);
      yield call(helperEventModal, {
        text: [
          'The threat has been increased by the threat level.',
          'An optional deployment will now be done.',
        ],
        title: 'Heavy Security',
      });

      yield put(optionalDeployment());
      yield take(OPTIONAL_DEPLOYMENT_DONE);

      const missionThreat = yield select(getMissionThreat);

      yield call(helperEventModal, {
        text: [
          'Doors 1 and 2 are now open.',
          `The blue terminal can now be destroyed (Health: ${missionThreat *
            2}, Defense: 2 {BLOCK}) to open the door to the weapons console.`,
        ],
        title: 'Heavy Security',
      });

      yield put(createAction('FIRE_IN_THE_SKY_HEAVY_SECURITY_TRIGGERED'));
      yield put(setMoveTarget(TARGET_BLUE_TERMINAL));

      // We're done
      break;
    }
  }
}

function* handleBlowThisThing(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 2 && type === 'terminal' && value === true) {
      track('fireInTheSky', 'blowThisThing', 'triggered');

      // Open door 3
      yield put(setMapStateActivated(3, 'door', true));

      yield call(
        helperDeploy,
        'Blow This Thing and Go Home',
        REFER_CAMPAIGN_GUIDE,
        [
          'Door 3 is now open.',
          '{ELITE}Kayn Somos{END} and a Stormtrooper group will now be deployed.',
        ],
        ['kaynSomos', 'Deploy to the entrance.'],
        ['stormtrooper', 'Deploy to the entrance.']
      );

      yield put(createAction('FIRE_IN_THE_SKY_BLOW_THING_TRIGGERED'));
      yield put(setMoveTarget(TARGET_WEAPON_CONSOLE));

      // We're done
      break;
    }
  }
}

function* handleWeaponsSliced(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'imperial' && value === true) {
      yield put(createAction('FIRE_IN_THE_SKY_WEAPON_CONSOLE_SLICED'));

      yield call(helperEventModal, {
        text: [
          'If all heroes are on or adjacent to the entrance, they depart (use the control in the right hand panel to trigger).',
        ],
        title: 'Fire in the Sky',
      });

      yield put(setMapStateVisible(1, 'imperial', false));
      yield put(setMapStateVisible(1, 'rebel', true));
      yield put(setMoveTarget(TARGET_ENTRANCE));

      // We're done
      break;
    }
  }
}

function* handleMissionEnd(): Generator<*, *, *> {
  yield take('FIRE_IN_THE_SKY_DEPART');
  yield put(displayModal('REBEL_VICTORY'));
  track('fireInTheSky', 'victory', 'departed');
}

// REQUIRED SAGA
function* handleRoundEnd(): Generator<*, *, *> {
  while (true) {
    yield take(STATUS_PHASE_END_ROUND_EFFECTS);
    const currentRound = yield select(getCurrentRound);

    if (currentRound === 9) {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      track('fireInTheSky', 'defeat', 'round');
      break;
    }

    yield put(setDeploymentPoint(getRandomDeploymentPoint()));
    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(helperInitialSetup, ['heavyStormtrooperElite', 'probeDroid', 'imperialOfficer']);
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
    'When a hero withdraws, he is incapacitated instead. The hero receives only 1 activation and can only move.',
    'The red imperial mission token is the weapons console. A hero can interact (2 {TECH} or {INSIGHT}) to slice it. Flip the token to the Rebel side.',
    'After the weapons console has been sliced, if all heroes are on or adjacent to the entrance, they depart.',
    'Doors are locked. A hero can interact with the green terminal (T1) (2 {TECH}) to open all doors except for the weapons console.',
  ]);

  yield put(missionSpecialSetupDone());
}

export function* fireInTheSky(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
  yield put(setMoveTarget(TARGET_GREEN_TERMINAL));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(getRandomDeploymentPoint()));

  yield all([
    fork(handleSpecialSetup),
    fork(handleHeavySecurity),
    fork(handleBlowThisThing),
    fork(handleWeaponsSliced),
    fork(handleMissionEnd),
    fork(handleHeroesWounded('fireInTheSky', 'FIRE_IN_THE_SKY_PRIORITY_TARGET_KILL_HERO')),
    fork(handleStatusPhaseBegin),
    fork(handleRoundEnd),
  ]);

  track('missionStart', 'fireInTheSky');
  yield put(missionSagaLoadDone());
}
