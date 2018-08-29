// @flow

import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {getAreAllHeroesWounded, WOUND_REBEL_HERO} from '../rebels';
import {
  getCurrentRound,
  increaseThreat,
  MISSION_SPECIAL_SETUP,
  missionSpecialSetupDone,
  SET_MAP_STATE_ACTIVATED,
  setAttackTarget,
  setDeploymentPoint,
  setMapStateVisible,
  setMoveTarget,
  STATUS_PHASE_BEGIN,
  STATUS_PHASE_END_ROUND_EFFECTS,
  statusPhaseBeginDone,
  statusPhaseEndRoundEffectsDone,
} from '../mission';
import createAction from '../createAction';
import {displayModal} from '../modal';
import getRandomItem from '../utils/getRandomItem';
import helperCheckMapStateActivations from './helpers/helperCheckMapStateActivations';
import helperChoiceModal from './helpers/helperChoiceModal';
import helperDeploy from './helpers/helperDeploy';
import helperEventModal from './helpers/helperEventModal';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import missions from '../../data/missions';
import {missionSagaLoadDone} from '../app';
import {REFER_CAMPAIGN_GUIDE} from './constants';
import {setCustomUnitAI} from '../imperials';
import snakeCase from 'lodash/snakeCase';
import type {StateType} from '../types';
import track from '../../lib/track';

// Constants

const MISSION_NAME = 'whiteNoise';
const MISSION_NAME_S = snakeCase(MISSION_NAME).toUpperCase();

// Pick a random side of the facility to attack to change things up on each play through
const INITIAL_DIRECTION = getRandomItem('top', 'bottom');
const TARGET_INITIAL_DOOR = INITIAL_DIRECTION === 'top' ? 'door 3' : 'door 4';
const TARGET_DOOR_1 = 'door 1';
const TARGET_DOOR_2 = 'door 2';
const TARGET_LAST_TERMINAL = 'the last terminal';
const TARGET_OFFICER = 'the closest Imperial officer';

const DEPLOYMENT_POINT_ACCESS_POINT =
  'A space containing 3 mission tokens closest to an Imperial officer (or one of the green deployment points)';

const CUSTOM_AI_OFFICERS = [
  {
    command: '{ACTION}{ACTION} Discard the adjacent terminal.',
    condition: 'If adjacent to a terminal',
  },
  {
    command:
      '{ACTION} Move towards the closest terminal, then {ACTION} Move towards the closest terminal.',
    condition: 'If not adjacent to a terminal',
  },
  {
    command:
      '{ACTION} Use Order ability on that friendly figure to have it move to {ATTACK_TARGET}.',
    condition: 'If within 2 spaces of a friendly target that is not adjacent to {ATTACK_TARGET}',
  },
  {
    command: 'Use Cower ability if a rolled dice does not cancel anything.',
    condition: 'Reaction - If defending while adjacent to a friendly figure',
  },
];

const CUSTOM_AI_OFFICERS_ELITE = [
  {
    command: '{ACTION}{ACTION} Discard the adjacent terminal.',
    condition: 'If adjacent to a terminal',
  },
  {
    command:
      '{ACTION} Move towards the closest terminal, then {ACTION} Move towards the closest terminal.',
    condition: 'If not adjacent to a terminal',
  },
  {
    command:
      '{ACTION} Use Executive Order ability on that friendly figure to have it attack {ATTACK_TARGET}.',
    condition:
      'If within 2 spaces of a friendly target that is within attack range and LOS of {ATTACK_TARGET}',
  },
  {
    command:
      '{ACTION} Use Executive Order ability on that friendly figure to have it move to {ATTACK_TARGET}.',
    condition: 'If within 2 spaces of a friendly target that is not adjacent to {ATTACK_TARGET}',
  },
  {
    command: 'Use Cower ability if a rolled dice does not cancel anything.',
    condition: 'Reaction - If defending while adjacent to a friendly figure',
  },
];

const CUSTOM_AI_EXTRA_COMMAND = {
  command: 'Gain three extra movement points.',
  condition: '(Trigger this effect for free)',
};

// Types

export type WhiteNoiseStateType = {
  allHeroesWounded: boolean,
  priorityTargetKillHero: boolean,
};

// State

const initialState = {
  allHeroesWounded: false,
  priorityTargetKillHero: false,
};

export default (state: WhiteNoiseStateType = initialState, action: Object) => {
  switch (action.type) {
    case `${MISSION_NAME_S}_PRIORITY_TARGET_KILL_HERO`:
      return {
        ...state,
        priorityTargetKillHero: action.payload,
      };
    case 'WHITE_NOISE_ALL_HEROES_WOUNDED':
      return {
        ...state,
        allHeroesWounded: true,
      };
    default:
      return state;
  }
};

// Selectors

// const getState = (state: StateType) => state[MISSION_NAME];
export const getWhiteNoiseGoalText = (state: StateType): string[] => {
  let goals = [];

  const {allHeroesWounded} = state.whiteNoise;

  if (allHeroesWounded) {
    goals = goals.concat([
      '{BOLD}Imperial Officers:{END}',
      'Gain 3 extra movement points.',
      '{BREAK}',
    ]);
  }

  goals = goals.concat([
    '{BOLD}Access Points (neutral tokens):{END}',
    'If a space contains 3 or more tokens, that space is an active deployment point.',
    '{BREAK}',
    'At the beginning of status phase, Imperials place 1 neutral token on a space containing a neutral mission token.',
    '{BREAK}',
    '{BOLD}Doors:{END}',
    'Locked. Imperial figures can attack (Health: 8, Defense: 1 black die).',
    '{BREAK}',
    'A door adjacent to a Rebel figure does not block movement, LOS, adjacency, or counting spaces.',
    '{BREAK}',
  ]);

  return goals;
};

// Sagas

function* handleTerminalDiscard(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (type === 'terminal' && value === true) {
      const allActivated = yield call(
        helperCheckMapStateActivations,
        ['terminal-1', 'terminal-2', 'terminal-3'],
        3
      );

      if (allActivated) {
        yield put(displayModal('IMPERIAL_VICTORY'));
        track(MISSION_NAME, 'defeat', 'terminals');
      } else {
        track(MISSION_NAME, 'neverGiveIn', 'triggered', id);
        yield call(helperEventModal, {
          text: [
            'Each hero may move up to 2 spaces (4 spaces if that hero has 2 activation tokens). Then, each hero chooses one of the following:',
            '- Become focused',
            '- Gain 3 movement points',
          ],
          title: 'Never Give In',
        });

        yield put(setMapStateVisible(id, type, false));
      }
    }
  }
}

function* handleDoorOpened(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (type === 'door' && value === true) {
      if (INITIAL_DIRECTION === 'top') {
        if (id === 3) {
          yield put(setAttackTarget(TARGET_DOOR_1));
        } else if (id === 1) {
          yield put(setAttackTarget(TARGET_DOOR_2));
        } else if (id === 2) {
          yield put(setAttackTarget(TARGET_LAST_TERMINAL));
        }
      } else {
        if (id === 4) {
          yield put(setAttackTarget(TARGET_DOOR_2));
        } else if (id === 2) {
          yield put(setAttackTarget(TARGET_DOOR_1));
        } else if (id === 1) {
          yield put(setAttackTarget(TARGET_LAST_TERMINAL));
        }
      }

      yield put(setMapStateVisible(id, type, false));
    }
  }
}

function* handleManTheBarricades(): Generator<*, *, *> {
  track(MISSION_NAME, 'manTheBarricades', 'triggered');

  yield call(
    helperDeploy,
    'Man the Barricades',
    '',
    ['An {ELITE}Elite E-Web Engineer{END} will now be deployed.'],
    [
      'eWebEngineerElite',
      'Deploy to the tile with an active terminal with the most neutral tokens.',
    ]
  );
}

function* handleAnotherPush(): Generator<*, *, *> {
  track(MISSION_NAME, 'anotherPush', 'triggered');

  yield call(helperEventModal, {
    story: REFER_CAMPAIGN_GUIDE,
    text: ['The threat has been increased by 3.'],
    title: 'Another Push',
  });

  yield put(increaseThreat(3));

  const answer = yield call(helperChoiceModal, 'Do the Rebels control a Boon?', 'Another Push');
  if (answer === 'no') {
    yield call(helperEventModal, {
      text: ['The threat has been increased again by 2.'],
      title: 'Another Push',
    });

    yield put(increaseThreat(2));
  }
}

function* handleHostileWildlife(): Generator<*, *, *> {
  track(MISSION_NAME, 'hostileWildlife', 'triggered');

  yield call(
    helperDeploy,
    'Hostile Wildlife',
    REFER_CAMPAIGN_GUIDE,
    ['A Wampa will now be deployed.'],
    ['wampa', 'Deploy to red point.']
  );
}

function* handleBackAndForth(): Generator<*, *, *> {
  track(MISSION_NAME, 'backAndForth', 'triggered');

  yield call(helperEventModal, {
    text: ['The threat has been increased by 4.'],
    title: 'Back and Forth',
  });

  yield put(increaseThreat(4));

  yield call(helperEventModal, {
    text: [
      'Each hero may interrupt to perform a move.',
      'Then each hero on or adjacent to a space containing 2 or more neutral tokens may interact to perform a {STRENGTH} test.',
      'If successful, discard a neutral token from that space.',
    ],
    title: 'Back and Forth',
  });
}

function* handlePressTheAdvantage(): Generator<*, *, *> {
  while (true) {
    while (true) {
      yield take([WOUND_REBEL_HERO]);
      const allWounded = yield select(getAreAllHeroesWounded);

      if (allWounded) {
        track(MISSION_NAME, 'pressTheAdvantage', 'triggered');

        yield call(helperEventModal, {
          story: REFER_CAMPAIGN_GUIDE,
          text: [
            "At the start of each Imperial Officer's activation, that figure gains 3 movement points.",
          ],
          title: 'Press the Advantage',
        });

        yield put(
          setCustomUnitAI('imperialOfficer', [CUSTOM_AI_EXTRA_COMMAND].concat(CUSTOM_AI_OFFICERS))
        );
        yield put(
          setCustomUnitAI(
            'imperialOfficerElite',
            [CUSTOM_AI_EXTRA_COMMAND].concat(CUSTOM_AI_OFFICERS_ELITE)
          )
        );

        yield put(createAction('WHITE_NOISE_ALL_HEROES_WOUNDED'));
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

    if (currentRound === 2) {
      yield call(handleManTheBarricades);
    } else if (currentRound === 3) {
      yield call(handleAnotherPush);
    } else if (currentRound === 4) {
      yield call(handleHostileWildlife);
    } else if (currentRound === 5) {
      yield call(handleBackAndForth);
    } else if (currentRound === 8) {
      // End game with Rebel victory
      yield put(displayModal('REBEL_VICTORY'));
      track(MISSION_NAME, 'victory', 'round');
      break;
    }

    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleStatusPhaseBegin(): Generator<*, *, *> {
  while (true) {
    yield take(STATUS_PHASE_BEGIN);

    yield call(helperEventModal, {
      text: [
        'Place 1 neutral mission token on a space containing a neutral mission token.',
        'Prioritize spaces containing 2 tokens already, with an Imperial officer nearby close to an active terminal.',
      ],
      title: 'White Noise',
    });

    yield put(statusPhaseBeginDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(helperInitialSetup, missions[MISSION_NAME].initialGroups);

  yield call(helperEventModal, {
    text: [
      'Place the neutral tiles according to the scenario map (they will not be tracked in the in-game map).',
    ],
    title: 'Initial Setup',
  });

  yield call(helperMissionBriefing, [
    'Doors are locked. An Imperial figure can attack a door (Health: 8, Defense: 1 black die).',
    'A door adjacent to a Rebel figure does not block movement, LOS, adjacency, or counting spaces.',
    'Neutral mission tokens are access points. If a space contains 3 or more tokens, that space is an active deployment point.',
    'At the beginning of each status phase, the Imperials place 1 neutral mission token on a space containing a neutral mission token.',
    'Imperial Officers gain: {ACTION}{ACTION}: Discard an adjacent terminal.',
  ]);

  yield put(missionSpecialSetupDone());
}

/*
3 terminals on the map. Doors 3 and 4 are right behind a single terminal while the inner terminal
is blocked by doors 1 and 2.
So, how to do this AI? Pick one direction and curve upwards? So if 3 first, then 1, then 2.
If 4 first, then 2, then 1. Might be the easiest way to define this.
*/
export function* whiteNoise(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_INITIAL_DOOR));
  yield put(setMoveTarget(TARGET_OFFICER));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_ACCESS_POINT));

  // Custom AI
  yield put(setCustomUnitAI('imperialOfficer', CUSTOM_AI_OFFICERS));
  yield put(setCustomUnitAI('imperialOfficerElite', CUSTOM_AI_OFFICERS_ELITE));

  yield all([
    fork(handleSpecialSetup),
    fork(handleTerminalDiscard),
    fork(handlePressTheAdvantage),
    fork(handleDoorOpened),
    fork(handleStatusPhaseBegin),
    fork(handleRoundEnd),
  ]);

  track('missionStart', MISSION_NAME);
  yield put(missionSagaLoadDone());
}
