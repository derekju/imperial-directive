// @flow

import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {
  DEFEAT_IMPERIAL_FIGURE,
  OPTIONAL_DEPLOYMENT_DONE,
  optionalDeployment,
  setImperialUnitHpBuff,
} from '../imperials';
import {
  getCurrentRound,
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
import {getMissionThreat, missionSagaLoadDone} from '../app';
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
import missions from '../../data/missions';
import snakeCase from 'lodash/snakeCase';
import type {StateType} from '../types';
import track from '../../lib/track';

// Constants

const MISSION_NAME = 'binaryRevolution';
const MISSION_NAME_S = snakeCase(MISSION_NAME).toUpperCase();

const DEPLOYMENT_POINT_GREEN_E = 'The east green deployment point';
const DEPLOYMENT_POINT_GREEN_W = 'The west green deployment point';
const DEPLOYMENT_POINT_RED_N = 'The north red deployment point';
const DEPLOYMENT_POINT_RED_S = 'The south red deployment point';

// Types

export type BinaryRevolutionStateType = {
  doorOpened: boolean,
  ig88KillCount: number,
  massProducedTriggered: boolean,
  priorityTargetKillHero: boolean,
};

// State

const initialState = {
  doorOpened: false,
  ig88KillCount: 0,
  massProducedTriggered: false,
  priorityTargetKillHero: false,
};

export default (state: BinaryRevolutionStateType = initialState, action: Object) => {
  switch (action.type) {
    case `${MISSION_NAME_S}_PRIORITY_TARGET_KILL_HERO`:
      return {
        ...state,
        priorityTargetKillHero: action.payload,
      };
    case 'BINARY_REVOLUTION_DOOR_OPENED':
      return {
        ...state,
        doorOpened: true,
      };
    case 'BINARY_REVOLUTION_MASS_PRODUCED_TRIGGERED':
      return {
        ...state,
        massProducedTriggered: true,
      };
    case 'BINARY_REVOLUTION_INCREMENT_KILL_COUNT':
      return {
        ...state,
        ig88KillCount: state.ig88KillCount + 1,
      };
    default:
      return state;
  }
};

// Selectors

const getState = (state: StateType) => state[MISSION_NAME];
export const getBinaryRevolutionGoalText = (state: StateType): string[] => {
  let goals = [];

  const {doorOpened, massProducedTriggered} = state.binaryRevolution;

  if (!doorOpened) {
    goals = goals.concat(['{BOLD}Current Goal:{END}', 'Open a door.', '{BREAK}']);
  }

  goals = goals.concat([
    '{BOLD}Green Imperial Tokens:{END}',
    'Copies of IG-88. Each token is its own group and will receive its own activation.',
    '{BREAK}',
  ]);

  if (massProducedTriggered) {
    goals = goals.concat([
      '{BOLD}IG-88:{END}',
      `Gains additional ${state.app.missionThreat} health.`,
      'His Relentless ability also causes the target to suffer 1 {DAMAGE}.',
    ]);
  }

  return goals;
};

// Sagas

function* setRandomDeploymentPoint(): Generator<*, *, *> {
  const {doorOpened} = yield select(getState);

  if (!doorOpened) {
    yield put(
      setDeploymentPoint(getRandomItem(DEPLOYMENT_POINT_GREEN_W, DEPLOYMENT_POINT_GREEN_E))
    );
  } else {
    yield put(
      setDeploymentPoint(
        getRandomItem(
          DEPLOYMENT_POINT_GREEN_W,
          DEPLOYMENT_POINT_GREEN_E,
          DEPLOYMENT_POINT_RED_S,
          DEPLOYMENT_POINT_RED_N
        )
      )
    );
  }
}

function* handleDroidUprising(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {doorOpened} = yield select(getState);
    const {id, type, value} = action.payload;
    if ([1, 2].includes(id) && type === 'door' && value === true && !doorOpened) {
      track(MISSION_NAME, 'droidUprising', 'triggered');

      yield put(createAction('BINARY_REVOLUTION_DOOR_OPENED'));

      yield put(setMapStateActivated(1, 'door', true));
      yield put(setMapStateActivated(2, 'door', true));

      yield call(
        helperDeploy,
        'Droid Uprising',
        'The machinery is more impressive than you realized.',
        [
          'All doors are now open.',
          'A copy of {ELITE}IG-88{END} (use a green Imperial mission token) will now be deployed.',
        ],
        ['ig88Copy', 'Deploy a green Imperial mission token to the blue point.']
      );

      yield call(helperEventModal, {
        text: [
          'The threat has been increased by the threat level.',
          'An optional deployment will now be done.',
        ],
        title: 'Droid Uprising',
      });

      // Increase current threat
      yield call(helperIncreaseThreat, 1);
      // Do optional deployment
      yield put(optionalDeployment());
      yield take(OPTIONAL_DEPLOYMENT_DONE);

      // We're done
      break;
    }
  }
}

function* handleMassProduced(): Generator<*, *, *> {
  track(MISSION_NAME, 'massProduced', 'triggered');

  const missionThreat = yield select(getMissionThreat);

  yield call(
    helperDeploy,
    'Mass Produced',
    REFER_CAMPAIGN_GUIDE,
    [
      `{ELITE}IG-88{END} will now be deployed. He gains ${missionThreat} additional health. His Relentless ability also causes the target to suffer 1 {DAMAGE}.`,
    ],
    ['ig88', 'Deploy to the yellow point.']
  );

  yield put(setImperialUnitHpBuff('ig88', missionThreat));

  yield call(helperEventModal, {
    text: ['The Rebels win when {ELITE}IG-88{END} and all copies of IG-88 are defeated.'],
    title: 'Mass Produced',
  });

  yield put(createAction('BINARY_REVOLUTION_MASS_PRODUCED_TRIGGERED'));
  yield put(updateRebelVictory('Defeat IG-88 and all copies of IG-88'));
}

function* handleIG88KillCount(): Generator<*, *, *> {
  while (true) {
    const action = yield take(DEFEAT_IMPERIAL_FIGURE);
    const {group} = action.payload;
    if (['ig88', 'ig88Copy'].includes(group.id)) {
      yield put(createAction('BINARY_REVOLUTION_INCREMENT_KILL_COUNT'));

      // Check count
      const {ig88KillCount} = yield select(getState);
      if (ig88KillCount >= 3) {
        // End game with rebel victory
        yield put(displayModal('REBEL_VICTORY'));
        track(MISSION_NAME, 'victory', 'ig88');
        break;
      }
    }
  }
}

// REQUIRED SAGA
function* handleRoundEnd(): Generator<*, *, *> {
  while (true) {
    yield take(STATUS_PHASE_END_ROUND_EFFECTS);
    const currentRound = yield select(getCurrentRound);

    // Handle Mass Produced
    const {doorOpened, massProducedTriggered} = yield select(getState);
    if (doorOpened && !massProducedTriggered) {
      yield call(handleMassProduced);
    }

    if (currentRound === 6) {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      track(MISSION_NAME, 'defeat', 'round');
      break;
    }

    yield call(setRandomDeploymentPoint);
    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(helperInitialSetup, missions[MISSION_NAME].initialGroups);
  yield call(helperEventModal, {
    text: [
      'Set aside 1 green Imperial mission token.',
      'The threat has been increased by twice the threat level.',
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
    `Doors are locked. A Rebel figure can attack a door (Health: ${missionThreat *
      2}, Defense: 1 black die).`,
    'Green Imperial mission tokens are copies of IG-88. They use the same deployment card but do not have the Assault ability. Each copy is its own group.',
  ]);

  yield call(
    helperDeploy,
    'Initial Setup',
    'The copy looks just like the real thing.',
    [
      'The Green Imperial mission token will now be deployed as specified on the map for initial setup.',
    ],
    ['ig88Copy', 'Deploy to the specified point.']
  );

  yield put(missionSpecialSetupDone());
}

export function* binaryRevolution(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
  yield put(setMoveTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
  // SET INITIAL DEPLOYMENT POINT
  yield call(setRandomDeploymentPoint);

  yield all([
    fork(handleSpecialSetup),
    fork(handleDroidUprising),
    fork(handleIG88KillCount),
    fork(handleHeroesWounded(MISSION_NAME, `${MISSION_NAME_S}_PRIORITY_TARGET_KILL_HERO`)),
    fork(handleStatusPhaseBegin),
    fork(handleRoundEnd),
  ]);

  track('missionStart', MISSION_NAME);
  yield put(missionSagaLoadDone());
}
