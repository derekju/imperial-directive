// @flow

import {all, call, fork, put, take} from 'redux-saga/effects';
import {
  MISSION_SPECIAL_SETUP,
  missionSpecialSetupDone,
  SET_MAP_STATE_ACTIVATED,
  setAttackTarget,
  setDeploymentPoint,
  setMoveTarget,
  STATUS_PHASE_END_ROUND_EFFECTS,
  statusPhaseEndRoundEffectsDone,
} from '../mission';
import {OPTIONAL_DEPLOYMENT_DONE, optionalDeployment, setCustomAI} from '../imperials';
import {REFER_CAMPAIGN_GUIDE, TARGET_HERO_CLOSEST_UNWOUNDED} from './constants';
import {addToRoster} from '../rebels';
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
import {missionSagaLoadDone} from '../app';
import snakeCase from 'lodash/snakeCase';
import type {StateType} from '../types';
import track from '../../lib/track';

// Constants

const MISSION_NAME = 'imperialEntanglements';
const MISSION_NAME_S = snakeCase(MISSION_NAME).toUpperCase();

const TARGET_HERO_DISK = 'the hero with the access disk';
const TARGET_RED_TERMINAL = 'the red terminal (T1)';
const TARGET_BLUE_TERMINAL = 'the blue terminal (T2)';

const DEPLOYMENT_POINT_GREEN_E = 'The east green deployment point';
const DEPLOYMENT_POINT_GREEN_W = 'The west green deployment point';

const CUSTOM_AI_START = [
  {
    command:
      '{ACTION} Move to be adjacent to the red terminal (T1), then {ACTION} Move to be adjacent to the red terminal (T1).',
    condition: 'If not adjacent to the red terminal (T1)',
  },
  {
    command: '{ACTION} Interact to retrieve the schematics',
    condition: 'If adjacent to the red terminal (T1) and the schematics have not been retrieved',
  },
];

const CUSTOM_AI_SCHEMATIC_RETRIEVED = [
  {
    command:
      '{ACTION} Move to be adjacent to the blue terminal (T2) ({ACTION} repeat if needed), then {ACTION} Interact with the blue terminal (T2).',
    condition: 'If carrying the schematics',
  },
  {
    command:
      '{ACTION} Move to be adjacent to the schematics, then {ACTION} Interact with the schematics to retrieve them.',
    condition: 'If no Imperial figure is carrying the schematics',
  },
];

// Types

export type ImperialEntanglementsStateType = {
  priorityTargetKillHero: boolean,
};

// State

const initialState = {
  priorityTargetKillHero: false,
};

export default (state: ImperialEntanglementsStateType = initialState, action: Object) => {
  switch (action.type) {
    case `${MISSION_NAME_S}_PRIORITY_TARGET_KILL_HERO`:
      return {
        ...state,
        priorityTargetKillHero: action.payload,
      };
    default:
      return state;
  }
};

// Selectors

// const getState = (state: StateType) => state[MISSION_NAME];
export const getImperialEntanglementsGoalText = (state: StateType): string[] => {
  let goals = [];
  goals = goals.concat([
    '{BOLD}Access Disk:{END}',
    'The blue neutral mission token. A healthy hero can interact with the blue terminal (T2) (3 {TECH} or {INSIGHT}) to retrieve.',
    'If the disk is dropped, a healthy hero can interact to retrieve it.',
    '{BREAK}',
    '{BOLD}Schematic:{END}',
    'The red neutral mission token. An Imperial figure can interact with the red terminal (T1) to retrieve.',
    'If the schematic is dropped, an Imperial figure can retrieve it.',
    '{BREAK}',
    '{BOLD}Airlock:{END}',
    'A hero carrying the disk can interact with the red terminal (T1) to release the airlock.',
    '{BREAK}',
    '{BOLD}Upload Schematic:{END}',
    'An Imperial figure carrying the schematic can interact with the blue terminal (T2) to upload the schematic.',
    '{BREAK}',
    '{BOLD}Controls:{END}',
    'Use the buttons below to signal when airlock is released or schematic uploaded.',
    '{BREAK}',
  ]);

  return goals;
};

// Sagas

function getRandomDeploymentPoint() {
  return getRandomItem(DEPLOYMENT_POINT_GREEN_W, DEPLOYMENT_POINT_GREEN_E);
}

function* handleUnauthorizedAccess(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 2 && type === 'terminal' && value === true) {
      track(MISSION_NAME, 'unauthorizedAccess', 'triggered');

      yield call(helperIncreaseThreat, 1);

      yield call(
        helperDeploy,
        'Unauthorized Access',
        REFER_CAMPAIGN_GUIDE,
        [
          'The heroes have the access disk now.',
          'The threat has been increased by the threat level.',
          'A Trandoshan Hunter group will now be deployed.',
        ],
        ['trandoshanHunter', 'Deploy to the red point.']
      );

      yield put(setAttackTarget(TARGET_HERO_DISK));

      // We're done
      break;
    }
  }
}

function* handleSchematicRetrieved(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'terminal' && value === true) {
      track(MISSION_NAME, 'schematicRetrieved', 'triggered');

      yield call(helperEventModal, {
        text: [
          'The Imperials have the schematics now.',
          'If they can upload the schematic at the blue terminal, the Imperials win.',
        ],
        title: 'Imperial Entanglements',
      });

      yield put(setMoveTarget(TARGET_BLUE_TERMINAL));
      yield put(setCustomAI(CUSTOM_AI_SCHEMATIC_RETRIEVED));

      // We're done
      break;
    }
  }
}

function* handleAirlockReleased(): Generator<*, *, *> {
  yield take('IMPERIAL_ENTANGLEMENTS_AIRLOCK_RELEASED');
  yield put(displayModal('REBEL_VICTORY'));
  track(MISSION_NAME, 'victory', 'airlock');
}

function* handleSchematicsUploaded(): Generator<*, *, *> {
  yield take('IMPERIAL_ENTANGLEMENTS_SCHEMATICS_UPLOADED');
  yield put(displayModal('IMPERIAL_VICTORY'));
  track(MISSION_NAME, 'defeat', 'schematics');
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
  yield call(helperInitialSetup, missions[MISSION_NAME].initialGroups);
  yield call(helperEventModal, {
    text: [
      'The threat has been increased by three times the threat level.',
      'An optional deployment will now be done.',
    ],
    title: 'Initial Setup',
  });

  // Double current threat
  yield call(helperIncreaseThreat, 3);
  // Do optional deployment
  yield put(optionalDeployment());
  yield take(OPTIONAL_DEPLOYMENT_DONE);

  // Deploy Han
  yield put(addToRoster('han'));

  yield call(helperEventModal, {
    text: [
      'Set aside 1 blue neutral mission token and 1 red neutral mission token.',
      'The heroes control {ELITE}Han Solo{END} as an ally at no additional cost.',
    ],
    title: 'Initial Setup',
  });

  yield call(helperMissionBriefing, [
    'The blue neutral mission token is the access disk. A healthy hero can interact with the blue terminal (T2) (3 {TECH} or {INSIGHT}) to retrieve the disk. If the disk is dropped, a healthy hero can interact to retrieve it.',
    'The red neutral mission token is the schematic. An Imperial figure can interact with the red terminal (T1) to retrieve the schematic. If the schematic is dropped, an Imperial figure can retrieve it.',
    'A hero carrying the disk can interact with the red terminal (T1) to release the airlock.',
    'An Imperial figure carrying the schematic can interact with the blue terminal (T2) to upload the schematic.',
  ]);

  yield call(helperEventModal, {
    text: ['Deploy the heroes to the blue points, divided as evenly as possible.'],
    title: 'Initial Setup',
  });

  yield put(missionSpecialSetupDone());
}

/*
Initial is to attack closest unwounded and move towards the red terminal
Once hero gets the token, attack the hero with the disk
Once imperial gets the token, attack hero with disk but move towards blue terminal (if have disk)
or towards the unit with the token
*/
export function* imperialEntanglements(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
  yield put(setMoveTarget(TARGET_RED_TERMINAL));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(getRandomDeploymentPoint()));

  yield put(setCustomAI(CUSTOM_AI_START));

  yield all([
    fork(handleSpecialSetup),
    fork(handleUnauthorizedAccess),
    fork(handleSchematicRetrieved),
    fork(handleAirlockReleased),
    fork(handleSchematicsUploaded),
    fork(handleHeroesWounded(MISSION_NAME, `${MISSION_NAME_S}_PRIORITY_TARGET_KILL_HERO`)),
    fork(handleStatusPhaseBegin),
    fork(handleRoundEnd),
  ]);

  track('missionStart', MISSION_NAME);
  yield put(missionSagaLoadDone());
}
