// @flow

import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {
  getCurrentRound,
  MISSION_SPECIAL_SETUP,
  missionSpecialSetupDone,
  SET_MAP_STATE_ACTIVATED,
  setAttackTarget,
  setDeploymentPoint,
  setMoveTarget,
  STATUS_PHASE_END_ROUND_EFFECTS,
  statusPhaseEndRoundEffectsDone,
} from '../mission';
import {REFER_CAMPAIGN_GUIDE, TARGET_HERO_CLOSEST_UNWOUNDED} from './constants';
import {displayModal} from '../modal';
import handleHeroesWounded from './sharedSagas/handleHeroesWounded';
import handleStatusPhaseBegin from './sharedSagas/handleStatusPhaseBegin';
import helperDeploy from './helpers/helperDeploy';
import helperEventModal from './helpers/helperEventModal';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import {missionSagaLoadDone} from '../app';
import {setCustomAI} from '../imperials';
import type {StateType} from '../types';
import track from '../../lib/track';

// Constants

const TARGET_OFFICER = 'the captured officer';

const DEPLOYMENT_POINT_GREEN = 'The green deployment point';
const DEPLOYMENT_POINT_YELLOW = 'The yellow deployment point';
const DEPLOYMENT_POINT_RED = 'The red deployment point';

const CUSTOM_AI = [
  {
    command:
      '{ACTION} Move until adjacent to the captured officer, then {ACTION} Interact with the officer to free him.',
    condition: 'If there are no Healthy Rebel figures within 3 spaces of the captured officer',
  },
];

// Types

export type TheSourceStateType = {
  priorityTargetKillHero: boolean,
};

// State

const initialState = {
  priorityTargetKillHero: false,
};

export default (state: TheSourceStateType = initialState, action: Object) => {
  switch (action.type) {
    case 'THE_SOURCE_PRIORITY_TARGET_KILL_HERO':
      return {
        ...state,
        priorityTargetKillHero: action.payload,
      };
    default:
      return state;
  }
};

// Selectors

const getState = (state: StateType) => state.theSource;
export const getTheSourceGoalText = (state: StateType): string[] => {
  const goals = [
    '{BOLD}Doors:{END}',
    'Are locked.',
    '{BREAK}',
    '{BOLD}Officer:{END}',
    'A Hero can interact with the officer to do one of the following:',
    '{BREAK}',
    '- Hero and the officer both move 2 spaces',
    '- Open a door adjacent to the officer',
    '- Secure a terminal adjacent to the officer',
    '{BREAK}',
    '{BOLD}Officer Freed:{END}',
    'If no Healthy Rebel figures within 3 spaces of the officer, an Imperial figure can interact with the officer to free him.',
    '{BREAK}',
  ];

  return goals;
};

// Sagas

function* handleAwaitingDeparture(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 2 && type === 'door' && value === true) {
      track('theSource', 'awaitingDeparture', 'triggered');

      yield put(setDeploymentPoint(DEPLOYMENT_POINT_YELLOW));
      yield call(
        helperDeploy,
        REFER_CAMPAIGN_GUIDE,
        [
          'Deploy a Stormtrooper group and an Imperial Officer to the right side of the Incinerator.',
        ],
        'Awaiting Departure',
        ['stormtrooper', 'imperialOfficer']
      );

      // We're done
      break;
    }
  }
}

function* handleOnBoard(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 3 && type === 'door' && value === true) {
      track('theSource', 'onBoard', 'triggered');

      yield put(setDeploymentPoint(DEPLOYMENT_POINT_RED));
      yield call(
        helperDeploy,
        REFER_CAMPAIGN_GUIDE,
        [
          'Deploy an {ELITE}Elite Stormtrooper{END} group to the center of the Security Station.',
          'Deploy an Imperial Officer adjacent to the terminal.',
        ],
        'On Board',
        ['stormtrooperElite', 'imperialOfficer']
      );
      // We're done
      break;
    }
  }
}

function* handleTerminalSecured(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {type, value} = action.payload;
    if (type === 'terminal' && value === true) {
      track('theSource', 'victory', 'terminals');
      yield put(displayModal('REBEL_VICTORY'));
      // We're done
      break;
    }
  }
}

function* handleOfficerFreed(): Generator<*, *, *> {
  yield take('THE_SOURCE_OFFICER_FREED');
  track('theSource', 'defeat', 'officerFreed');
  yield put(displayModal('IMPERIAL_VICTORY'));
}

function* handleOpportuneMoment(): Generator<*, *, *> {
  yield call(helperEventModal, {
    text: [
      'Choose the first option that is eligible:',
      '- Resolve the Order ability of the captured officer, choosing an Imperial figure within his LOS instead of within 2 spaces.',
      '- Each Imperial figure within LOS of the captured officer gains 2 movement points. Use those points to move each figure adjacent to the captured officer.',
      '- Move the captured officer 1 space towards the nearest Imperial figure',
    ],
    title: 'Opportune Moment',
  });
}

// REQUIRED SAGA
function* handleRoundEnd(): Generator<*, *, *> {
  while (true) {
    yield take(STATUS_PHASE_END_ROUND_EFFECTS);
    const currentRound = yield select(getCurrentRound);

    if (currentRound === 8) {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      track('theSource', 'defeat', 'round');
      break;
    }

    yield call(handleOpportuneMoment);

    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(helperInitialSetup, 'Nexu, {ELITE}Elite Nexu{END}, Royal Guard');
  yield call(helperMissionBriefing, [
    'Deploy an Elite Imperial Officer as shown on the map. The officer is a captured officer and is a neutral figure.',
    'All doors are locked.',
    'A Hero can interact with the officer to do one of the following:',
    'Hero and the officer both move 2 spaces',
    'Open a door adjacent to the officer',
    'Secure a terminal adjacent to the officer',
    'If there are no Healthy Rebel figures within 3 spaces of the officer, an Imperial figure can interact with the officer to free him.',
  ]);
  yield put(missionSpecialSetupDone());
}

export function* theSource(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
  yield put(setMoveTarget(TARGET_OFFICER));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN));

  yield put(setCustomAI(CUSTOM_AI, ['nexu', 'nexuElite']));

  yield all([
    fork(handleSpecialSetup),
    fork(handleAwaitingDeparture),
    fork(handleOnBoard),
    fork(handleTerminalSecured),
    fork(handleOfficerFreed),
    fork(handleHeroesWounded('theSource', 'THE_SOURCE_PRIORITY_TARGET_KILL_HERO')),
    fork(handleStatusPhaseBegin),
    fork(handleRoundEnd),
  ]);

  track('missionStart', 'theSource');
  yield put(missionSagaLoadDone());
}
