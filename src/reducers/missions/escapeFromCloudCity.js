// @flow

import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {
  getCurrentRound,
  MISSION_SPECIAL_SETUP,
  missionSpecialSetupDone,
  SET_MAP_STATE_ACTIVATED,
  setAttackTarget,
  setDeploymentPoint,
  setMapStateVisible,
  setMoveTarget,
  STATUS_PHASE_END_ROUND_EFFECTS,
  statusPhaseEndRoundEffectsDone,
  updateRebelVictory,
} from '../mission';
import {getMissionThreat, missionSagaLoadDone} from '../app';
import {OPTIONAL_DEPLOYMENT_DONE, optionalDeployment} from '../imperials';
import {
  REFER_CAMPAIGN_GUIDE,
  STRING_WITHDRAW_INCAPACITATED,
  TARGET_HERO_CLOSEST_UNWOUNDED,
} from './constants';
import createAction from '../createAction';
import {displayModal} from '../modal';
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

const MISSION_NAME = 'escapeFromCloudCity';
const MISSION_NAME_S = snakeCase(MISSION_NAME).toUpperCase();

const TARGET_DOOR_HALL = 'the door to the Hall (tile 27B)';
const TARGET_DOOR_CELL = 'the door to the Cell (tile 36B)';
const TARGET_REBEL_WITH_PRISONER = 'the closest Rebel figure (carrying a prisoner)';
const TARGET_SHUTTLE = 'the inner most spot on the Shuttle (tiles 36B, 31B, 33B)';

const DEPLOYMENT_POINT_GREEN = 'The north green deployment point';
const DEPLOYMENT_POINT_RED = 'The red deployment point';

// Types

export type EscapeFromCloudCityStateType = {
  cellDoorOpened: boolean,
  hallDoorOpened: boolean,
  hiredGuardsTriggered: boolean,
  priorityTargetKillHero: boolean,
  prisonersClaimed: number,
};

// State

const initialState = {
  cellDoorOpened: false,
  hallDoorOpened: false,
  hiredGuardsTriggered: false,
  priorityTargetKillHero: false,
  prisonersClaimed: 0,
};

export default (state: EscapeFromCloudCityStateType = initialState, action: Object) => {
  switch (action.type) {
    case `${MISSION_NAME_S}_PRIORITY_TARGET_KILL_HERO`:
      return {
        ...state,
        priorityTargetKillHero: action.payload,
      };
    case 'ESCAPE_FROM_CLOUD_CITY_HIRED_GUARDS_TRIGGERED':
      return {
        ...state,
        hiredGuardsTriggered: true,
      };
    case 'ESCAPE_FROM_CLOUD_CITY_HALL_DOOR_OPENED':
      return {
        ...state,
        hallDoorOpened: true,
      };
    case 'ESCAPE_FROM_CLOUD_CITY_CELL_DOOR_OPENED':
      return {
        ...state,
        cellDoorOpened: true,
      };
    case 'ESCAPE_FROM_CLOUD_CITY_PRISONER_CLAIMED':
      return {
        ...state,
        prisonersClaimed: Math.min(state.prisonersClaimed + 1, 3),
      };
    default:
      return state;
  }
};

// Selectors

// const getState = (state: StateType) => state[MISSION_NAME];
export const getEscapeFromCloudCityGoalText = (state: StateType): string[] => {
  let goals = [];

  const {cellDoorOpened, hallDoorOpened, prisonersClaimed} = state.escapeFromCloudCity;

  if (!hallDoorOpened) {
    goals = goals.concat([
      '{BOLD}Current Goal:{END}',
      'Open the door to the Hall (tile 27B).',
      '{BREAK}',
    ]);
  } else if (!cellDoorOpened) {
    goals = goals.concat([
      '{BOLD}Current Goal:{END}',
      'Open the door to the Cell (tile 36B).',
      '{BREAK}',
    ]);
  } else {
    goals = goals.concat([
      '{BOLD}Prisoners:{END}',
      'Rebel mission tokens. Rebel figure can interact to retrieve.',
      '{BREAK}',
    ]);

    if (prisonersClaimed < 3) {
      goals = goals.concat([
        '{BOLD}Shuttle:{END}',
        'Tiles 36B, 31B, 33B. When a figure carrying a prisoner is on the shuttle, click the button to claim the prisoner.',
        '{BREAK}',
        `Prisoners Claimed: ${prisonersClaimed}`,
        '{BREAK}',
        '---PLACEHOLDER_CLAIM_PRISONER---',
        '{BREAK}',
      ]);
    } else {
      goals = goals.concat([
        '{BOLD}Shuttle:{END}',
        'When all prisoners are claimed, all heroes are on the shuttle, and there are 3 or fewer Imperial figures on the Shuttle, click the button.',
        '{BREAK}',
        '---PLACEHOLDER_SHUTTLE_LAUNCHED---',
        '{BREAK}',
      ]);
    }

    goals = goals.concat([
      '{BOLD}Shuttle Action:{END}',
      'Rebel figures on Shuttle gain {ACTION}: Choose an adjacent hostile figure and test {STRENGTH}. If successful, push that figure up to 2 spaces.',
      '{BREAK}',
    ]);
  }

  goals = goals.concat([
    '{BOLD}Doors:{END}',
    'The door to the Hall (tile 27B) and Cell (tile 36B) are locked.',
    `A Rebel figure can attack a door (Health: ${state.app.missionThreat *
      2}, Defense: None) or interact (2 {STRENGTH} or {TECH}) to open.`,
    '{BREAK}',
    '{BOLD}Withdrawn hero:{END}',
    'Withdrawn heroes receive only 1 action and they can only move.',
  ]);

  return goals;
};

// Sagas

function* handleHiredGuards(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'door' && value === true) {
      track(MISSION_NAME, 'hiredGuards', 'triggered');

      yield put(createAction('ESCAPE_FROM_CLOUD_CITY_HALL_DOOR_OPENED'));

      yield call(
        helperDeploy,
        'Hired Guards',
        '',
        ['A HK Assassin Droid group will now be deployed.'],
        ['hkAssassinDroid', 'Deploy to the red point.']
      );

      yield put(setDeploymentPoint(DEPLOYMENT_POINT_RED));
      yield put(createAction('ESCAPE_FROM_CLOUD_CITY_HIRED_GUARDS_TRIGGERED'));

      yield put(setMoveTarget(TARGET_DOOR_CELL));

      // We're done
      break;
    }
  }
}

function* handleGetToTheShip(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 2 && type === 'door' && value === true) {
      track(MISSION_NAME, 'getToTheShip', 'triggered');

      yield put(createAction('ESCAPE_FROM_CLOUD_CITY_CELL_DOOR_OPENED'));

      yield call(helperIncreaseThreat, 1);
      yield call(helperEventModal, {
        story: REFER_CAMPAIGN_GUIDE,
        text: [
          'The threat has been increased by the threat level.',
          'Place 1 Rebel mission token on each of the blue points in the Cell (tile 36B).',
          'Rebel mission tokens are prisoners. A Rebel figure can interact to retrieve. A figure can carry only 1 prisoner.',
          'When a figure carrying a prisoner is on the Shuttle (tiles 36B, 31B, 33B), the heroes claim that prisoner.',
          'Rebel figures on the Shuttle gain {ACTION}: Choose an adjacent hostile figure and test {STRENGTH}. If successful, push that figure up to 2 spaces.',
          'When all prisoners are claimed, all heroes are on the shuttle, and there are 3 or fewer Imperial figures on the Shuttle (tiles 36B, 31B, 33B), the Rebels win.',
        ],
        title: 'Get to the Ship',
      });

      yield put(setMapStateVisible(1, 'rebel', true));
      yield put(setMapStateVisible(2, 'rebel', true));
      yield put(setMapStateVisible(3, 'rebel', true));
      yield put(
        updateRebelVictory(
          'When all 3 prisoners are claimed, all heroes are on the Shuttle (tiles 36B, 31B, 33B), and there are 3 or fewer Imperial figures on the Shuttle'
        )
      );

      yield put(setAttackTarget(TARGET_REBEL_WITH_PRISONER));
      yield put(setMoveTarget(TARGET_SHUTTLE));

      // We're done
      break;
    }
  }
}

function* handleShuttleLaunched(): Generator<*, *, *> {
  yield take('ESCAPE_FROM_CLOUD_CITY_SHUTTLE_LAUNCHED');
  yield put(displayModal('REBEL_VICTORY'));
  track(MISSION_NAME, 'victory', 'shuttle');
}

// REQUIRED SAGA
function* handleRoundEnd(): Generator<*, *, *> {
  while (true) {
    yield take(STATUS_PHASE_END_ROUND_EFFECTS);
    const currentRound = yield select(getCurrentRound);

    if (currentRound === 6) {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      track(MISSION_NAME, 'defeat', 'round');
      break;
    }

    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(helperInitialSetup, missions[MISSION_NAME].initialGroups);
  yield call(helperEventModal, {
    text: [
      'Set aside 3 Rebel mission tokens.',
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
    STRING_WITHDRAW_INCAPACITATED,
    `Doors to the Hall (tile 27B) and Cell (tile 36B) are locked. A Rebel figure can attack a door (Health: ${missionThreat *
      2}, Defense: None) or interact (2 {STRENGTH} or {TECH}) to open.`,
  ]);

  yield put(missionSpecialSetupDone());
}

export function* escapeFromCloudCity(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
  yield put(setMoveTarget(TARGET_DOOR_HALL));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN));

  yield all([
    fork(handleSpecialSetup),
    fork(handleHiredGuards),
    fork(handleGetToTheShip),
    fork(handleShuttleLaunched),
    fork(handleHeroesWounded(MISSION_NAME, `${MISSION_NAME_S}_PRIORITY_TARGET_KILL_HERO`)),
    fork(handleStatusPhaseBegin),
    fork(handleRoundEnd),
  ]);

  track('missionStart', MISSION_NAME);
  yield put(missionSagaLoadDone());
}
