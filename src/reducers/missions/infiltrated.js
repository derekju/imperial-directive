// @flow

import {
  ACTIVATION_PHASE_BEGIN,
  changePlayerTurn,
  getCurrentRound,
  increaseThreat,
  MISSION_SPECIAL_SETUP,
  missionSpecialSetupDone,
  PLAYER_IMPERIALS,
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
import {all, call, cancel, fork, put, select, take} from 'redux-saga/effects';
import {getMissionThreat, missionSagaLoadDone} from '../app';
import {OPTIONAL_DEPLOYMENT_DONE, optionalDeployment} from '../imperials';
import {REFER_CAMPAIGN_GUIDE, TARGET_HERO_CLOSEST_UNWOUNDED} from './constants';
import createAction from '../createAction';
import {displayModal} from '../modal';
import getRandomItem from '../utils/getRandomItem';
import handleHeroesWounded from './sharedSagas/handleHeroesWounded';
import handleStatusPhaseBegin from './sharedSagas/handleStatusPhaseBegin';
import helperCheckMapStateActivations from './helpers/helperCheckMapStateActivations';
import helperChoiceModal from './helpers/helperChoiceModal';
import helperDeploy from './helpers/helperDeploy';
import helperEventModal from './helpers/helperEventModal';
import helperIncreaseThreat from './helpers/helperIncreaseThreat';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import type {StateType} from '../types';
import track from '../../lib/track';

// Constants

const TARGET_HYPERDRIVE = 'the hyperdrive (T1)';
const TARGET_DOOR_HANGAR = 'the door to the Hangar (tile 19A) closest to a Rebel figure';
const TARGET_TERMINAL_HANGAR = 'the terminal in the Hangar (tile 19A)';
const TARGET_SHUTTLE = 'a space adjacent to the shuttle';

const DEPLOYMENT_POINT_GREEN_N = 'The north green deployment point';
const DEPLOYMENT_POINT_GREEN_S = 'The south green deployment point';
const DEPLOYMENT_POINT_BLUE_E = 'The east blue deployment point';
const DEPLOYMENT_POINT_BLUE_W = 'The west blue deployment point';
const DEPLOYMENT_POINT_RED = 'The red deployment point';

// Types

export type InfiltratedStateType = {
  hangarDoorOpened: boolean,
  hyperdriveSliced: boolean,
  priorityTargetKillHero: boolean,
  shuttleActivated: boolean,
};

// State

const initialState = {
  hangarDoorOpened: false,
  hyperdriveSliced: false,
  priorityTargetKillHero: false,
  shuttleActivated: false,
};

export default (state: InfiltratedStateType = initialState, action: Object) => {
  switch (action.type) {
    case 'INFILTRATED_PRIORITY_TARGET_KILL_HERO':
      return {
        ...state,
        priorityTargetKillHero: action.payload,
      };
    case 'INFILTRATED_HYPERDRIVE_SLICED':
      return {
        ...state,
        hyperdriveSliced: true,
      };
    case 'INFILTRATED_HANGAR_DOOR_OPENED':
      return {
        ...state,
        hangarDoorOpened: true,
      };
    case 'INFILTRATED_SHUTTLE_ACTIVATED':
      return {
        ...state,
        shuttleActivated: true,
      };
    default:
      return state;
  }
};

// Selectors

const getState = (state: StateType) => state.infiltrated;
export const getInfiltratedGoalText = (state: StateType): string[] => {
  let goals = [];

  const {hangarDoorOpened, hyperdriveSliced, shuttleActivated} = state.infiltrated;
  const {missionThreat} = state.app;

  if (!hyperdriveSliced) {
    goals = goals.concat([
      '{BOLD}Current Goal:{END}',
      'Slice the hyperdrive (T1).',
      'Interact (3 {TECH} or {INSIGHT}) to slice.',
      '{BREAK}',
    ]);
  } else if (!hangarDoorOpened) {
    goals = goals.concat([
      '{BOLD}Current Goal:{END}',
      `Destroy a door to the Hangar (tile 19A) (Health: ${missionThreat * 2}, Defense: 1 {BLOCK}).`,
      '{BREAK}',
    ]);
  } else {
    if (!shuttleActivated) {
      goals = goals.concat([
        '{BOLD}Activating Shuttle:{END}',
        'Interact with the terminal in the Hangar (T5).',
        '{BREAK}',
      ]);
    }
    goals = goals.concat([
      '{BOLD}Stealing Shuttle:{END}',
      'Once activated, at the end of the round, if there is at least 1 healthy hero adjacent to the activated shuttle and there are fewer than 2 Imperial figures adjacent to the shuttle, it is stolen.',
      '{BREAK}',
    ]);
  }

  goals = goals.concat([
    '{BOLD}Weapons Console (T2):{END}',
    'Interact ({TECH}, {INSIGHT}, or {STRENGTH}) to destroy it.',
    'End of each round, a hero will suffer 2 {DAMAGE}.',
  ]);

  if (hyperdriveSliced) {
    goals = goals.concat([
      '{BREAK}',
      '{BOLD}Surveillance (T3):{END}',
      'Interact ({TECH}, {INSIGHT}, or {STRENGTH}) to destroy it. Beginning of each round, Imperials go first.',
      '{BREAK}',
      '{BOLD}Alarm (T4):{END}',
      'Interact ({TECH}, {INSIGHT}, or {STRENGTH}) to destroy it. End of each round, threat increases by 2.',
    ]);
  }

  return goals;
};

// Sagas

function* setRandomDeploymentPoint(): Generator<*, *, *> {
  const {hangarDoorOpened, hyperdriveSliced} = yield select(getState);

  if (hangarDoorOpened) {
    yield put(setDeploymentPoint(DEPLOYMENT_POINT_RED));
  } else if (hyperdriveSliced) {
    yield put(setDeploymentPoint(DEPLOYMENT_POINT_BLUE_W, DEPLOYMENT_POINT_BLUE_E));
  } else {
    yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN_N, DEPLOYMENT_POINT_GREEN_S));
  }
}

function* handleBlueTerminal(): Generator<*, *, *> {
  const activated = yield call(helperCheckMapStateActivations, ['terminal-2'], 1);
  if (!activated) {
    yield call(helperEventModal, {
      text: ['The Rebel hero closest to being wounded suffers 2 {DAMAGE}.'],
      title: 'Weapons Console',
    });
  }
}

function* handleRedTerminal(): Generator<*, *, *> {
  // After the hyperdrive is sliced, if the red terminal is active, increase threat
  const {hyperdriveSliced} = yield select(getState);
  if (hyperdriveSliced) {
    const activated = yield call(helperCheckMapStateActivations, ['terminal-4'], 1);
    if (!activated) {
      yield put(increaseThreat(2));
      yield call(helperEventModal, {
        text: ['The threat has been increased by 2.'],
        title: 'Alarm',
      });
    }
  }
}

function* handleShuttle(): Generator<*, *, *> {
  const {hangarDoorOpened} = yield select(getState);

  if (hangarDoorOpened) {
    const activated = yield call(helperCheckMapStateActivations, ['terminal-5'], 1);
    if (activated) {
      const answer = yield call(
        helperChoiceModal,
        'Is there at least 1 healthy hero adjacent to the activated shuttle and there are fewer than 2 Imperial figures adjacent to the shuttle?',
        'Shuttle'
      );
      if (answer === 'yes') {
        track('infiltrated', 'victory', 'shuttle');
        yield put(displayModal('REBEL_VICTORY'));
        // Kill this mission
        yield cancel();
      }
    }
  }
}

function* handleMoreProblems(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'terminal' && value === true) {
      track('infiltrated', 'moreProblems', 'triggered');

      // Open door 1 and door 2
      yield put(setMapStateActivated(1, 'door', true));
      yield put(setMapStateActivated(2, 'door', true));

      yield call(
        helperDeploy,
        'More Problems',
        'The troops were waiting for you.',
        ['{ELITE}Kayn Somos{END} and a Heavy Stormtrooper group will now be deployed.'],
        ['kaynSomos', 'Deploy to the east blue point.'],
        ['heavyStormtrooper', 'Deploy to the east blue point.']
      );

      yield put(createAction('INFILTRATED_HYPERDRIVE_SLICED'));
      yield put(setMoveTarget(TARGET_DOOR_HANGAR));

      // We're done
      break;
    }
  }
}

function* handleGetToTheShip(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if ([3, 4].includes(id) && type === 'door' && value === true) {
      track('infiltrated', 'getToTheShip', 'triggered');

      // Open all doors
      yield put(setMapStateActivated(1, 'door', true));
      yield put(setMapStateActivated(2, 'door', true));
      yield put(setMapStateActivated(3, 'door', true));
      yield put(setMapStateActivated(4, 'door', true));

      yield put(createAction('INFILTRATED_HANGAR_DOOR_OPENED'));
      yield put(setDeploymentPoint(DEPLOYMENT_POINT_RED));

      yield call(helperEventModal, {
        text: [
          'Open all doors.',
          'Place the four Imperial mission tokens on the yellow points. These tokens represent the shuttle.',
          'The threat has been increased by the threat level.',
          'An optional deployment will now be done.',
        ],
        title: 'Get to the Ship',
      });

      // Increase current threat
      yield call(helperIncreaseThreat, 1);
      // Do optional deployment
      yield put(optionalDeployment());
      yield take(OPTIONAL_DEPLOYMENT_DONE);

      yield call(helperEventModal, {
        text: [
          'A Hero can interact with the Hangar terminal (T5) to activate the shuttle. Flip the Imperial tokens to the Rebel side.',
          'At the end of any round, if there is at least 1 healthy hero adjacent to the activated shuttle and there are fewer than 2 Imperial figures adjacent to the shuttle, the heroes steal the shuttle and escape.',
        ],
        title: 'Get to the Ship',
      });

      yield put(updateRebelVictory('Steal the shuttle'));
      yield put(setMoveTarget(TARGET_TERMINAL_HANGAR));

      // We're done
      break;
    }
  }
}

function* handleShuttleActivated(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 5 && type === 'terminal' && value === true) {
      yield call(helperEventModal, {
        text: [
          'Activate the shuttle by flipping the imperial mission tokens over to the Rebel side.',
          'The Rebels win once the shuttle is stolen.',
        ],
        title: 'Shuttle',
      });

      yield put(createAction('INFILTRATED_SHUTTLE_ACTIVATED'));
      yield put(setMoveTarget(TARGET_SHUTTLE));

      // We're done
      break;
    }
  }
}

function* handleRoundStart(): Generator<*, *, *> {
  while (true) {
    yield take(ACTIVATION_PHASE_BEGIN);

    // After the hyperdrive is sliced, if the yellow terminal is active, then give the imperials the first turn
    const {hyperdriveSliced} = yield select(getState);
    if (hyperdriveSliced) {
      const activated = yield call(helperCheckMapStateActivations, ['terminal-3'], 1);
      if (!activated) {
        yield call(helperEventModal, {
          text: [
            'Because the surveillance terminal  is still active, the Imperials receive the first turn this round.',
          ],
          title: 'Surveillance Terminal',
        });

        // Need to change the turn to the imperials since they get to move first each round
        yield put(changePlayerTurn(PLAYER_IMPERIALS));
      }
    }
  }
}

// REQUIRED SAGA
function* handleRoundEnd(): Generator<*, *, *> {
  while (true) {
    yield take(STATUS_PHASE_END_ROUND_EFFECTS);
    const currentRound = yield select(getCurrentRound);

    yield call(handleShuttle);
    yield call(handleBlueTerminal);
    yield call(handleRedTerminal);

    if (currentRound === 8) {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      track('infiltrated', 'defeat', 'round');
      // Kill this mission
      yield cancel();

      break;
    }

    yield call(setRandomDeploymentPoint);
    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(helperInitialSetup, ['imperialOfficerElite', 'stormtrooper']);
  yield call(helperEventModal, {
    text: [
      'Set aside 4 Imperial mission tokens.',
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

  yield call(helperMissionBriefing, [
    'Doors are locked.',
    'The blue terminal is the weapons console. A hero can interact ({TECH}, {INSIGHT}, or {STRENGTH}) to destroy it. At the end of each round, if the weapons console is still on the map, the Rebel hero closest to being wounded suffers 2 {DAMAGE}.',
    'A hero can interact with the green terminal (3 {TECH} or {INSIGHT}) to slice the hyperdrive.',
  ]);

  yield put(missionSpecialSetupDone());
}

export function* infiltrated(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
  yield put(setMoveTarget(TARGET_HYPERDRIVE));
  // SET INITIAL DEPLOYMENT POINT
  yield call(setRandomDeploymentPoint);

  yield all([
    fork(handleSpecialSetup),
    fork(handleMoreProblems),
    fork(handleGetToTheShip),
    fork(handleShuttleActivated),
    fork(handleHeroesWounded('infiltrated', 'INFILTRATED_PRIORITY_TARGET_KILL_HERO')),
    fork(handleStatusPhaseBegin),
    fork(handleRoundStart),
    fork(handleRoundEnd),
  ]);

  track('missionStart', 'infiltrated');
  yield put(missionSagaLoadDone());
}
