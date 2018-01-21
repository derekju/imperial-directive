// @flow

import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {
  addToRoster,
  enableEscape,
  SET_REBEL_ESCAPED,
  silentSetRebelActivated,
  WOUND_REBEL_OTHER,
} from '../rebels';
import {
  getCurrentRound,
  increaseThreat,
  MISSION_SPECIAL_SETUP,
  missionSpecialSetupDone,
  SET_MAP_STATE_ACTIVATED,
  setAttackTarget,
  setDeploymentPoint,
  setMoveTarget,
  STATUS_PHASE_END_ROUND_EFFECTS,
  statusPhaseEndRoundEffectsDone,
  updateImperialVictory,
  updateRebelVictory,
} from '../mission';
import {getLastDeployedGroupOfId, setCustomAI, setImperialGroupActivated} from '../imperials';
import {REFER_CAMPAIGN_GUIDE, TARGET_CLOSEST_REBEL, TARGET_ENTRANCE_TOKEN} from './constants';
import createAction from '../createAction';
import {displayModal} from '../modal';
import handleStatusPhaseBegin from './sharedSagas/handleStatusPhaseBegin';
import helperDeploy from './helpers/helperDeploy';
import helperEventModal from './helpers/helperEventModal';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import {missionSagaLoadDone} from '../app';
import type {StateType} from '../types';
import track from '../../lib/track';

// Constants

const TARGET_DOOR = 'the door to the Back Room';
const TARGET_HAN = 'Han';

const DEPLOYMENT_POINT_GREEN_NW = 'The north western green deployment point';

const CUSTOM_AI = [
  {
    command:
      '{ACTION} Move until within 3 spaces of the Back Room door, then {ACTION} Move until within 3 spaces of the Back Room door.',
    condition: 'If not within 3 spaces of the Back Room door',
  },
];

// Types

export type FlySoloStateType = {
  backRoomDoorOpened: boolean,
  priorityTargetKillHero: boolean,
};

// State

const initialState = {
  backRoomDoorOpened: false,
  priorityTargetKillHero: false,
};

export default (state: FlySoloStateType = initialState, action: Object) => {
  switch (action.type) {
    case 'FLY_SOLO_PRIORITY_TARGET_KILL_HERO':
      return {
        ...state,
        priorityTargetKillHero: action.payload,
      };
    case 'FLY_SOLO_BACK_ROOM_DOOR_OPENED':
      return {
        ...state,
        backRoomDoorOpened: true,
      };
    default:
      return state;
  }
};

// Selectors

const getState = (state: StateType) => state.flySolo;
export const getFlySoloGoalText = (state: StateType): string[] => {
  if (!state.flySolo.backRoomDoorOpened) {
    const goals = [
      '{BOLD}Current Goal:{END}',
      'Open the door to the Back Room.',
      '{BREAK}',
      '{BOLD}Back Room Door:{END}',
      'Locked. A hero can interact ({STRENGTH}) to open the door.',
    ];
    return goals;
  }

  const goals = ['{BOLD}Escaping:{END}', '{ELITE}Han{END} can escape through the entrance.'];
  return goals;
};

// Sagas

function* handleStrangePatronsEvent(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 2 && type === 'door' && value === true) {
      track('flySolo', 'strangePatron', 'triggered');
      yield call(
        helperDeploy,
        REFER_CAMPAIGN_GUIDE,
        [
          'Deploy an {ELITE}Elite Stormtrooper{END} group and an {ELITE}Elite Imperial Officer{END} to the Back Room near the door. They are deployed exhausted.',
          'Deploy {ELITE}Han Solo{END} to the Storage Closet. He is also deployed exhausted.',
        ],
        'Strange Patrons',
        ['stormtrooperElite', 'imperialOfficerElite']
      );
      yield put(addToRoster('han'));
      yield put(silentSetRebelActivated('han'));

      const lastEliteStormtrooperGroup = yield select(
        getLastDeployedGroupOfId,
        'stormtrooperElite'
      );
      const lastEliteImperialOfficerGroup = yield select(
        getLastDeployedGroupOfId,
        'imperialOfficerElite'
      );
      yield put(setImperialGroupActivated(lastEliteStormtrooperGroup));
      yield put(setImperialGroupActivated(lastEliteImperialOfficerGroup));
      yield put(createAction('FLY_SOLO_BACK_ROOM_DOOR_OPENED', true));
      yield call(handleTimeToRunEvent);
      break;
    }
  }
}

function* handleDaringEscapeEvent(): Generator<*, *, *> {
  track('flySolo', 'daringEscape', 'triggered');
  yield call(
    helperDeploy,
    REFER_CAMPAIGN_GUIDE,
    [
      'The door to the Back Room opens.',
      'Deploy an {ELITE}Elite Stormtrooper{END} group to the Back Room. Each unit suffers 2 {DAMAGE}.',
      'Deploy {ELITE}Han Solo{END} to the blue point. He suffers 4 {DAMAGE}.',
      'The threat has been increased.',
    ],
    'Daring Escape',
    ['stormtrooperElite']
  );
  yield put(addToRoster('han'));
  yield put(increaseThreat(4));
  yield put(createAction('FLY_SOLO_BACK_ROOM_DOOR_OPENED', true));
  yield call(handleTimeToRunEvent);
}

function* handleTimeToRunEvent(): Generator<*, *, *> {
  yield call(
    helperDeploy,
    REFER_CAMPAIGN_GUIDE,
    ['Deploy {ELITE}IG-88{END} to the entrance.', 'The threat has been increased.'],
    'Time to Run',
    ['ig88']
  );
  yield put(increaseThreat(4));
  yield call(helperEventModal, {
    text: ['The Rebels win if {ELITE}Han Solo{END} escapes through the entrance.'],
    title: 'Time to Run',
  });
  yield put(updateRebelVictory('Han Solo escapes through the entrance'));
  yield put(updateImperialVictory('Han Solo is defeated'));
  yield put(enableEscape());
  // Remove custom AI
  yield put(setCustomAI(null));
  // Switch targets
  yield put(setAttackTarget(TARGET_HAN));
  yield put(setMoveTarget(TARGET_ENTRANCE_TOKEN));
}

function* handleHanDefeated(): Generator<*, *, *> {
  while (true) {
    const action = yield take(WOUND_REBEL_OTHER);
    const {id} = action.payload;
    // If chewy killed and all heroes are already dead
    if (id === 'han') {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      track('flySolo', 'defeat', 'hanDefeated');
      break;
    }
  }
}

function* handleHanEscaped(): Generator<*, *, *> {
  yield take(SET_REBEL_ESCAPED);
  // End game with rebel victory
  yield put(displayModal('REBEL_VICTORY'));
  track('flySolo', 'victory', 'hanEscaped');
}

// REQUIRED SAGA
function* handleRoundEnd(): Generator<*, *, *> {
  while (true) {
    yield take(STATUS_PHASE_END_ROUND_EFFECTS);
    const currentRound = yield select(getCurrentRound);

    if (currentRound === 3) {
      // Potentially do Daring Escape event
      const {backRoomDoorOpened} = yield select(getState);
      if (!backRoomDoorOpened) {
        yield call(handleDaringEscapeEvent);
      }
    }

    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(helperInitialSetup, 'Probe Droid, Stormtrooper (2), Trandoshan Hunter');
  yield call(helperMissionBriefing, [
    'The door to the back room is locked. A hero can interact ({STRENGTH}) to open it.',
    'Heroes cannot bring {ELITE}Han Solo{END} to this mission!',
  ]);
  // Set custom AI
  yield put(setCustomAI(CUSTOM_AI));
  yield put(missionSpecialSetupDone());
}

/*
Priority target definitions:
1) Initial attack is default, move is door
2) Once door opens, attack is han, move is entrance
*/
export function* flySolo(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_CLOSEST_REBEL));
  yield put(setMoveTarget(TARGET_DOOR));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN_NW));

  yield all([
    fork(handleSpecialSetup),
    fork(handleStrangePatronsEvent),
    fork(handleHanDefeated),
    fork(handleHanEscaped),
    fork(handleStatusPhaseBegin),
    fork(handleRoundEnd),
  ]);

  track('missionStart', 'flySolo');
  yield put(missionSagaLoadDone());
}
