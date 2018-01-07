// @flow

import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {getAreAllHeroesWounded, getIsOneHeroLeft, WOUND_REBEL_HERO} from '../rebels';
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
  STATUS_PHASE_BEGIN,
  STATUS_PHASE_END_ROUND_EFFECTS,
  statusPhaseBeginDone,
  statusPhaseEndRoundEffectsDone,
  updateRebelVictory,
} from '../mission';
import {OPTIONAL_DEPLOYMENT_DONE, optionalDeployment, setCustomAI} from '../imperials';
import {REFER_CAMPAIGN_GUIDE, TARGET_HERO_CLOSEST_UNWOUNDED, TARGET_REMAINING} from './constants';
import createAction from '../createAction';
import {displayModal} from '../modal';
import helperDeploy from './helpers/helperDeploy';
import helperEventModal from './helpers/helperEventModal';
import helperIncreaseThreat from './helpers/helperIncreaseThreat';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import {missionSagaLoadDone} from '../app';
import type {StateType} from '../types';
import track from '../../lib/track';

// Constants

const TARGET_DOOR = 'the closest door';
const TARGET_REBEL_CLOSE_TERMINAL = 'the closest Rebel figure in an interior space';
const TARGET_TERMINAL = 'the closest terminal';

const DEPLOYMENT_POINT_GREEN = 'The southern green deployment point';
const DEPLOYMENT_POINT_RED = 'The red deployment point';

const CUSTOM_AI = [
  {
    command: '{ACTION} Interact with terminal to destroy it',
    condition: 'If adjacent to a terminal and no Healthy Rebel figure within 2 spaces',
  },
];

const CUSTOM_AI_WITH_DOOR = [
  {
    command: '{ACTION} Interact with terminal to destroy it',
    condition: 'If adjacent to a terminal and no Healthy Rebel figure within 2 spaces',
  },
  {
    command: '{ACTION} Move to closest door, then {ACTION} Attack the door.',
    condition: 'If figure is outside',
  },
];

// Types

export type GenerousDonationsStateType = {
  priorityTargetKillHero: boolean,
  tokensCollected: number,
  virusUploaded: boolean,
};

// State

const initialState = {
  priorityTargetKillHero: false,
  tokensCollected: 0,
  virusUploaded: false,
};

export default (state: GenerousDonationsStateType = initialState, action: Object) => {
  switch (action.type) {
    case 'GENEROUS_DONATIONS_ADD_TOKENS':
      return {
        ...state,
        tokensCollected: state.tokensCollected + action.payload.tokens,
      };
    case 'GENEROUS_DONATIONS_SET_VIRUS_UPLOADED':
      return {
        ...state,
        virusUploaded: true,
      };
    case 'GENEROUS_DONATIONS_PRIORITY_TARGET_KILL_HERO':
      return {
        ...state,
        priorityTargetKillHero: action.payload,
      };
    default:
      return state;
  }
};

// Selectors

const getState = (state: StateType) => state.generousDonations;
export const getGenerousDonationsGoalText = (state: StateType): string[] => {
  if (!state.generousDonations.virusUploaded) {
    return [
      '{BOLD}Current Goal:{END}',
      'Upload the virus.',
      '{BREAK}',
      '{BOLD}Terminals:{END}',
      'Interact ({TECH}) to upload virus.',
      '{BREAK}',
      '{BOLD}Doors:{END}',
      'Health: 5, Defense: 1 {BLOCK}',
    ];
  } else {
    return [
      '{BOLD}Mission Tokens Collected:{END}',
      `${state.generousDonations.tokensCollected} (12 needed)`,
      '(Each active terminal at end of round will generate 1 token)',
      '{BREAK}',
      '{BOLD}Doors:{END}',
      'Health: 5, Defense: 1 {BLOCK}',
      '{BREAK}',
      '{BOLD}Terminals:{END}',
      'Click the button when the Imperials destroy a terminal.',
      '{BREAK}',
    ];
  }
};

// Sagas

function* handleClearAreaEvent(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {type, value} = action.payload;
    if (type === 'door' && value === true) {
      track('generousDonations', 'clearTheArea', 'triggered');
      yield call(
        helperDeploy,
        REFER_CAMPAIGN_GUIDE,
        [
          'Deploy an {ELITE}Elite E-Web Engineer{END} and a Royal Guard group to the Command Room.',
          'Deploy the units adjacent to the terminal (T3)',
        ],
        'Clear the Area',
        ['eWebEngineerElite', 'royalGuard']
      );
      const {priorityTargetKillHero} = yield select(getState);
      if (!priorityTargetKillHero) {
        yield put(setMoveTarget(TARGET_TERMINAL));
      }
      yield put(setDeploymentPoint(DEPLOYMENT_POINT_RED));
      break;
    }
  }
}

function* handleTheVirusEvent(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (type === 'terminal' && value === true) {
      track('generousDonations', 'theVirus', 'triggered');
      yield call(
        helperDeploy,
        REFER_CAMPAIGN_GUIDE,
        [
          'Deploy an {ELITE}AT-ST{END} and Stormtrooper group to the yellow point.',
          'The threat has now been increased.',
        ],
        'The Virus',
        ['atst', 'stormtrooper']
      );
      yield call(helperIncreaseThreat, 1);

      yield call(helperEventModal, {
        text: ['Close all doors.'],
        title: 'The Virus',
      });
      yield put(setMapStateActivated(1, 'door', false));
      yield put(setMapStateActivated(2, 'door', false));

      yield call(helperEventModal, {
        text: [
          'Doors do not block movement or LOS for Rebels.',
          'If there is not a healthy Rebel figure within 2 spaces of a terminal, an Imperial figure can interact with the terminal to discard it.',
          'At the end of each Round, heroes claim a mission token for each terminal still standing.',
          'Once the Rebels have 12 tokens, they win.',
        ],
        title: 'The Virus',
      });

      yield put(updateRebelVictory('Collect 12 mission tokens'));
      yield put(createAction('GENEROUS_DONATIONS_SET_VIRUS_UPLOADED'));

      // Set custom AI for collecting terminals
      yield put(setCustomAI(CUSTOM_AI_WITH_DOOR));
      // Since doors closed, if unit not in range of the terminal they are probably outside
      const {priorityTargetKillHero} = yield select(getState);
      if (!priorityTargetKillHero) {
        yield put(setAttackTarget(TARGET_REBEL_CLOSE_TERMINAL));
        yield put(setMoveTarget(TARGET_TERMINAL));
      }

      // Change map state back to unactivated and disable interaction
      // Goal panel will be used instead
      yield put(setMapStateActivated(id, 'terminal', false));
      yield put(setMapStateInteractable(1, 'terminal', false));
      yield put(setMapStateInteractable(2, 'terminal', false));
      yield put(setMapStateInteractable(3, 'terminal', false));

      yield put(createAction('GENEROUS_DONATIONS_VIRUS_EVENT'));
      // We're done
      break;
    }
  }
}

function* handleDoorOpenedAfterVirusUploaded(): Generator<*, *, *> {
  yield take('GENEROUS_DONATIONS_VIRUS_EVENT');
  const action = yield take(SET_MAP_STATE_ACTIVATED);
  const {type, value} = action.payload;
  if (type === 'door' && value === true) {
    yield put(setCustomAI(CUSTOM_AI));
  }
}

function* getAliveTerminals(): Generator<*, *, *> {
  const mapStates = yield select(getMapStates);
  let numTerminals = 0;
  if (mapStates['terminal-1'].visible) {
    numTerminals += 1;
  }
  if (mapStates['terminal-2'].visible) {
    numTerminals += 1;
  }
  if (mapStates['terminal-3'].visible) {
    numTerminals += 1;
  }
  return numTerminals;
}

function* handleTerminalsDestroyed(): Generator<*, *, *> {
  while (true) {
    const action = yield take('GENEROUS_DONATIONS_TERMINAL_DESTROYED');
    const {id} = action.payload;
    yield put(setMapStateVisible(id, 'terminal', false));

    const aliveTerminals = yield call(getAliveTerminals);
    if (aliveTerminals === 0) {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      track('generousDonations', 'defeat', 'terminals');
    }
  }
}

function* handleHeroesWounded(): Generator<*, *, *> {
  while (true) {
    yield take(WOUND_REBEL_HERO);
    const allWounded = yield select(getAreAllHeroesWounded);
    if (allWounded) {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      track('generousDonations', 'defeat', 'wounded');
      break;
    }
    const isOneHeroLeft = yield select(getIsOneHeroLeft);
    if (isOneHeroLeft) {
      // Switch targets
      yield put(createAction('GENEROUS_DONATIONS_PRIORITY_TARGET_KILL_HERO', true));
      yield put(setAttackTarget(TARGET_REMAINING));
      yield put(setMoveTarget(TARGET_REMAINING));
    }
  }
}

// REQUIRED SAGA
function* handleStatusPhaseBegin(): Generator<*, *, *> {
  while (true) {
    yield take(STATUS_PHASE_BEGIN);
    yield put(statusPhaseBeginDone());
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
      track('generousDonations', 'defeat', 'round');
      break;
    }

    const {tokensCollected, virusUploaded} = yield select(getState);
    if (virusUploaded) {
      // Give rebels their tokens based on how many terminals are still alive
      const terminalsLeft = yield call(getAliveTerminals);

      if (tokensCollected + terminalsLeft >= 12) {
        yield put(displayModal('REBEL_VICTORY'));
        track('generousDonations', 'victory', 'tokens');
        break;
      }

      yield put(createAction('GENEROUS_DONATIONS_ADD_TOKENS', {tokens: terminalsLeft}));

      yield call(helperEventModal, {
        text: [
          terminalsLeft === 1
            ? `The heroes collected ${terminalsLeft} mission token.`
            : `The heroes collected ${terminalsLeft} mission tokens.`,
        ],
        title: 'Generous Donations',
      });
    }

    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(helperInitialSetup, 'E-Web Engineer, Probe Droid, Trandoshan Hunter');
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
    'Doors are locked. A figure can attack a door (Health: 5, Defense: 1 {BLOCK}).',
    'A Rebel figure can interact with a terminal ({TECH}) to upload the virus.',
  ]);
  yield put(missionSpecialSetupDone());
}

/*
Priority target definitions:
1) Initial attack is default, move is door
2) Once door opens, move is terminal 2
3) If terminal 2 is down, move is nearest terminal
4) At any point if heroes - 1 are wounded, attack and move are the last remaining hero
*/
export function* generousDonations(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
  yield put(setMoveTarget(TARGET_DOOR));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN));

  yield all([
    fork(handleSpecialSetup),
    fork(handleClearAreaEvent),
    fork(handleTheVirusEvent),
    fork(handleDoorOpenedAfterVirusUploaded),
    fork(handleTerminalsDestroyed),
    fork(handleHeroesWounded),
    fork(handleStatusPhaseBegin),
    fork(handleRoundEnd),
  ]);

  track('missionStart', 'generousDonations');
  yield put(missionSagaLoadDone());
}
