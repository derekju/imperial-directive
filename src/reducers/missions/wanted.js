// @flow

import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {
  enableEscape,
  getAreAllHeroesWounded,
  getIsOneHeroLeft,
  SET_REBEL_ESCAPED,
  WOUND_REBEL_HERO,
} from '../rebels';
import {
  getCurrentRound,
  getMapStates,
  MISSION_SPECIAL_SETUP,
  missionSpecialSetupDone,
  SET_MAP_STATE_ACTIVATED,
  setAttackTarget,
  setDeploymentPoint,
  setMapStateActivated,
  setMapStateInteractable,
  setMapStateVisible,
  setMoveTarget,
  STATUS_PHASE_END_ROUND_EFFECTS,
  statusPhaseEndRoundEffectsDone,
  updateRebelVictory,
} from '../mission';
import {OPTIONAL_DEPLOYMENT_DONE, optionalDeployment} from '../imperials';
import {TARGET_HERO_CLOSEST_UNWOUNDED, TARGET_REMAINING} from './constants';
import createAction from '../createAction';
import {displayModal} from '../modal';
import handleStatusPhaseBegin from './sharedSagas/handleStatusPhaseBegin';
import helperDeploy from './helpers/helperDeploy';
import helperEventModal from './helpers/helperEventModal';
import helperIncreaseThreat from './helpers/helperIncreaseThreat';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import {getMissionThreat, missionSagaLoadDone} from '../app';
import type {StateType} from '../types';
import track from '../../lib/track';

// Constants

const TARGET_OFFICE_DOOR = 'the figure carrying the keycard';
const TARGET_EXIT_DOOR = 'the door to the exit';

const DEPLOYMENT_POINT_GREEN = 'The green deployment point';
const DEPLOYMENT_POINT_RED = 'The red deployment point';

// Types

export type WantedStateType = {
  officeDoorOpened: boolean,
  priorityTargetKillHero: boolean,
};

// State

const initialState = {
  officeDoorOpened: false,
  priorityTargetKillHero: false,
};

export default (state: WantedStateType = initialState, action: Object) => {
  switch (action.type) {
    case 'WANTED_PRIORITY_TARGET_KILL_HERO':
      return {
        ...state,
        priorityTargetKillHero: action.payload,
      };
    case 'WANTED_OFFICE_DOOR_OPENED':
      return {
        ...state,
        officeDoorOpened: true,
      };
    default:
      return state;
  }
};

// Selectors

const getState = (state: StateType) => state.wanted;
export const getWantedGoalText = (state: StateType): string[] => {
  if (state.wanted.officeDoorOpened) {
    const goals = [
      '{BOLD}Departing:{END}',
      'Once all heroes are on or adjacent to the Rebel mission token (the exit), escape with a hero',
      '{BREAK}',
      '{BOLD}Terminal:{END}',
      'Opens the door to the exit. The door to the exit will automatically close at the end of each round',
      '{BREAK}',
      '{BOLD}Barricades (Imperial mission tokens):{END}',
      `Considered blocking terrain. Health: ${state.app.missionThreat * 3}, Defense: 1 {BLOCK}`,
      '{BREAK}',
      '{BOLD}Store Room (tile 22B) Door:{END}',
      'Unlocked.',
      '{BREAK}',
      '{BOLD}Withdrawn hero:{END}',
      'Withdrawn heroes receive only 1 action and they can only move.',
      '{BREAK}',
    ];

    return goals;
  } else {
    const goals = [
      '{BOLD}Current Goal:{END}',
      'Open door to the office (tile 24B)',
      '{BREAK}',
      '{BOLD}Keycard/Office Door:{END}',
      'The neutral mission token is a keycard. Once dropped, a hero can interact with it to retrieve it. A hero carrying the keycard can open the door to the office (tile 24B).',
      '{BREAK}',
      '{BOLD}Store Room (tile 22B) Door:{END}',
      'Locked.',
      '{BREAK}',
      '{BOLD}Withdrawn hero:{END}',
      'Withdrawn heroes receive only 1 action and they can only move.',
      '{BREAK}',
    ];

    return goals;
  }
};

// Sagas

function* handleHuntedDownEvent(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 2 && type === 'door' && value === true) {
      track('wanted', 'huntedDown', 'triggered');

      yield call(
        helperDeploy,
        'Hunted Down',
        'Opening the door, you see the droid staring back at you, ready to attack.',
        [
          'Deploy {ELITE}IG-88{END} to the red point.',
          'The threat has been increased by the threat level.',
          'A Probe Droid will now be deployed.',
        ],
        ['ig88', 'Deploy to the red point.'],
        ['probeDroid', 'Deploy to the yellow point.']
      );

      yield call(helperIncreaseThreat, 1);

      const missionThreat = yield select(getMissionThreat);

      yield call(helperEventModal, {
        text: [
          'The door to the Store room is now unlocked.',
          'A hero can interact with the terminal ({TECH}) to open the door to the exit.',
          'At the end of the round, the door to the exit closes!',
          `Imperial mission tokens are barricades and are blocking terrain. They can be attacked - Health: ${missionThreat *
            3}, Defense: 1 {BLOCK}`,
          'When all heroes are on or adjacent to the Rebel mission token, the heroes can depart.',
        ],
        title: 'Hunted Down',
      });

      yield put(setMapStateInteractable(1, 'door', true));
      yield put(createAction('WANTED_OFFICE_DOOR_OPENED', true));
      yield put(
        updateRebelVictory(
          'The heroes escape once all heroes are adjacent or on the Rebel mission token'
        )
      );

      // Switch deployment
      const {priorityTargetKillHero} = yield select(getState);
      if (!priorityTargetKillHero) {
        yield put(setMoveTarget(TARGET_EXIT_DOOR));
      }
      yield put(setDeploymentPoint(DEPLOYMENT_POINT_RED));

      // We're done
      break;
    }
  }
}

function* handleBarricadesDestroyed(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (type === 'imperial' && value === true) {
      yield put(setMapStateVisible(id, type, false));
    }
  }
}

function* handleTerminalInteraction(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'terminal' && value === true) {
      yield put(setMapStateActivated(3, 'door', true));
      // Enable escaping
      yield put(enableEscape());
    }
  }
}

function* handleHeroesDepart(): Generator<*, *, *> {
  while (true) {
    yield take(SET_REBEL_ESCAPED);
    yield put(displayModal('REBEL_VICTORY'));
    track('wanted', 'victory', 'escaped');
  }
}

function* handleHeroesWounded(): Generator<*, *, *> {
  while (true) {
    yield take(WOUND_REBEL_HERO);
    const allWounded = yield select(getAreAllHeroesWounded);
    if (allWounded) {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      track('wanted', 'defeat', 'wounded');
      break;
    }
    const isOneHeroLeft = yield select(getIsOneHeroLeft);
    if (isOneHeroLeft) {
      // Switch targets
      yield put(createAction('WANTED_PRIORITY_TARGET_KILL_HERO', true));
      yield put(setAttackTarget(TARGET_REMAINING));
      yield put(setMoveTarget(TARGET_REMAINING));
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
      track('wanted', 'defeat', 'round');
      break;
    }

    // If door to exit is open, close it
    const mapStates = yield select(getMapStates);
    // Now check all 4 terminals, if they are activated, then game over for rebels
    if (mapStates['door-3'].activated) {
      yield put(setMapStateActivated(3, 'door', false));
      yield put(setMapStateActivated(1, 'terminal', false));
      yield call(helperEventModal, {
        text: ['The door to the exit has been shut!'],
        title: 'Wanted',
      });
    }

    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(helperInitialSetup, ['probeDroid', 'trandoshanHunter']);
  yield call(helperEventModal, {
    text: [
      'Pick a Trandoshan Hunter unit at random. Place one neutral mission token underneath it.',
    ],
    title: 'Initial Setup',
  });
  yield call(helperEventModal, {
    text: [
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
    'Doors are locked to all figures.',
    'The neutral mission token is a keycard. Once dropped, a hero can interact with it to retrieve it. A hero carrying the keycard can open the door to the office (tile 24B).',
  ]);
  yield put(missionSpecialSetupDone());
}

/*
Priority target definitions:
1) Initial attack is default, move is office door
2) Once door opens, move is the exit door
3) At any point if heroes - 1 are wounded, attack and move are the last remaining hero
*/
export function* wanted(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
  yield put(setMoveTarget(TARGET_OFFICE_DOOR));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN));

  yield all([
    fork(handleSpecialSetup),
    fork(handleHuntedDownEvent),
    fork(handleBarricadesDestroyed),
    fork(handleTerminalInteraction),
    fork(handleHeroesDepart),
    fork(handleHeroesWounded),
    fork(handleStatusPhaseBegin),
    fork(handleRoundEnd),
  ]);

  track('missionStart', 'wanted');
  yield put(missionSagaLoadDone());
}
