// @flow

import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {
  getAreAllHeroesWounded,
  getIsOneHeroLeft,
  WOUND_REBEL_HERO,
} from '../rebels';
import {
  getCurrentRound,
  MISSION_SPECIAL_SETUP,
  missionSpecialSetupDone,
  SET_MAP_STATE_ACTIVATED,
  setAttackTarget,
  setDeploymentPoint,
  setMapStateInteractable,
  setMapStateVisible,
  setMoveTarget,
  statusPhaseEndRoundEffectsDone,
  STATUS_PHASE_END_ROUND_EFFECTS,
  updateRebelVictory,
} from '../mission';
import {
  REFER_CAMPAIGN_GUIDE,
  TARGET_HERO_CLOSEST_UNWOUNDED,
  TARGET_REMAINING,
} from './constants';
import createAction from '../createAction';
import {displayModal} from '../modal';
import helperDeploy from './helpers/helperDeploy';
import helperEventModal from './helpers/helperEventModal';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import {missionSagaLoadDone} from '../app';
import shuffle from 'lodash/shuffle';
import type {StateType} from '../types';
import track from '../../lib/track';

// Constants

const TARGET_BLAST_DOOR = 'the Blast Door';

const DEPLOYMENT_POINT_GREEN = 'The south western green deployment point';
const DEPLOYMENT_POINT_INTERIOR = 'An interior deployment point close to the most Rebel figures. If none exist, the south western green deployment point.';

const MAX_BOMBARDMENTS = 8;

// Types

export type IncomingStateType = {
  activatedTerminalIndexes: number[],
  bombardmentFromCorridorDone: boolean,
  corridorEntered: boolean,
  needToDoPursuitEvent: boolean,
  numberBombardments: number,
  priorityTargetKillHero: boolean,
  terminals: string[],
  yellowTerminalsDiscovered: number,
};

// State

const initialState = {
  activatedTerminalIndexes: [],
  bombardmentFromCorridorDone: false,
  corridorEntered: false,
  needToDoPursuitEvent: false,
  numberBombardments: 0,
  priorityTargetKillHero: false,
  terminals: shuffle(['yellow', 'yellow', 'blue', 'blue']),
  yellowTerminalsDiscovered: 0,
};

export default (state: IncomingStateType = initialState, action: Object) => {
  switch (action.type) {
    case 'INCOMING_PRIORITY_TARGET_KILL_HERO':
      return {
        ...state,
        priorityTargetKillHero: action.payload,
      };
    case 'INCOMING_ENTER_CORRIDOR':
      return {
        ...state,
        corridorEntered: true,
      };
    case 'INCOMING_SET_NEED_TO_DO_PURSUIT_EVENT':
      return {
        ...state,
        needToDoPursuitEvent: action.payload.value,
      };
    case 'INCOMING_INCREMENT_BOMBARDMENTS':
      return {
        ...state,
        numberBombardments: state.numberBombardments + 1,
      };
    case 'INCOMING_SET_ACTIVATED_TERMINAL':
      return {
        ...state,
        activatedTerminalIndexes: state.activatedTerminalIndexes.concat([action.payload.id]),
      };
    case 'INCOMING_INCREMENT_YELLOW_TERMINALS':
      return {
        ...state,
        yellowTerminalsDiscovered: state.yellowTerminalsDiscovered + 1,
      };
    case 'INCOMING_SET_BOMBARDMENT_FROM_CORRIDOR':
      return {
        ...state,
        bombardmentFromCorridorDone: true,
      };
    default:
      return state;
  }
};

// Selectors

const getState = (state: StateType) => state.incoming;
export const getIncomingGoalText = (state: StateType): string[] => {
  if (!state.incoming.corridorEntered) {
    const goals = [
      '{BOLD}Current Goal:{END}',
      'Rebel figure enters the Corridor (tile 26B).',
      '{BREAK}',
      '{BOLD}Terminals:{END}',
      'Hero can interact with 3 {TECH} or {INSIGHT}. If Imperial figure nearby apply -1 {SURGE}.',
      '{BREAK}',
      '{BOLD}Corridor:{END}',
    ];
    return goals;
  } else if (state.incoming.yellowTerminalsDiscovered < 2) {
    const goals = [
      '{BOLD}Current Goal:{END}',
      'Reveal both terminals that have clues to the exit.',
      '{BREAK}',
      '{BOLD}Terminals:{END}',
      'Hero can interact with 3 {TECH} or {INSIGHT}. If Imperial figure nearby apply -1 {SURGE}.',
      '{BREAK}',
      '{BOLD}Rubble:{END}',
      'Difficult terrain. Any rubble adjacent to outside edge of the map is a deployment point.',
    ];
    return goals;
  } else {
    const goals = [
      '{BOLD}Current Goal:{END}',
      'Successfully interact with the blast door to escape.',
      '{BREAK}',
      '{BOLD}Blast Door:{END}',
      'Interact with 3 {STRENGTH} .',
      '{BREAK}',
      '{BOLD}Rubble:{END}',
      'Difficult terrain. Any rubble adjacent to outside edge of the map is a deployment point.',
    ];
    return goals;
  }
};

// Sagas

function* handleCorridorEntered(): Generator<*, *, *> {
  yield take('INCOMING_ENTER_CORRIDOR');
  track('incoming', 'bombardment', 'triggered');
  yield call(helperEventModal, {
    text: [
      'Imperial mission tokens are rubble. Rubble is difficult terrain. If the rubble is adjacent to the outside edge of the map, it is an active deployment point.',
      'At the each of each round, the structure will be bombarded.',
      'The structure will now be bombarded.',
    ],
    title: 'Bombardment',
  });
  yield put(createAction('INCOMING_SET_NEED_TO_DO_PURSUIT_EVENT', {value: true}))
  yield put(setMapStateInteractable(1, 'terminal', true));
  yield put(setMapStateInteractable(2, 'terminal', true));
  yield put(setMapStateInteractable(3, 'terminal', true));
  yield put(setMapStateInteractable(4, 'terminal', true));
  yield call(handleBombardment);
  // Bombardment begins so switch deployment
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_INTERIOR));
}

function* handleBombardment(title: string = 'Bombardment'): Generator<*, *, *> {
  yield call(helperEventModal, {
    text: [
      'Place an Imperial mission token in an interior space within LOS of an Imperial troop. Use the following rules to determine where to place it:',
      '1) Within 3 spaces of 2 or more Rebel figures.',
      '2) Along the outside edge of the map and within 3 spaces of any Rebel figure.',
      '3) Along the outside edge of the map.',
      '4) Within 3 spaces of a Rebel figure.',
      'Any Rebel figure within 3 spaces of the placed token is stunned. If they are already stunned, they instead suffer 2 {DAMAGE}.',
    ],
    title: 'Bombardment',
  });
  yield put(createAction('INCOMING_INCREMENT_BOMBARDMENTS'));
}

function* handleYellowTerminalRevealed(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    const {activatedTerminalIndexes, numberBombardments, priorityTargetKillHero, terminals, yellowTerminalsDiscovered} = yield select(getState);

    if (!activatedTerminalIndexes.includes(id) && type === 'terminal' && value === true) {
      // Check which color is revealed
      const color = terminals[id - 1];
      // Logic based on color
      switch (color) {
        case 'yellow':
          track('incoming', 'schematics', 'triggered');
          yield call(helperEventModal, {
            text: [
              'The Rebels have discovered a clue to the exit!',
            ],
            title: 'Schematics',
          });

          if (yellowTerminalsDiscovered === 0) {
            if (numberBombardments < MAX_BOMBARDMENTS) {
              yield call(helperEventModal, {
                story: REFER_CAMPAIGN_GUIDE,
                text: [
                  'The structure will now be bombarded.',
                ],
                title: 'Schematics',
              });
              yield call(handleBombardment);
            }
          } else if (yellowTerminalsDiscovered === 1) {
            track('incoming', 'hiddenPassage', 'triggered');
            yield call(helperEventModal, {
              story: REFER_CAMPAIGN_GUIDE,
              text: [
                'Place a neutral mission token on the red point.',
                'The neutral mission token is the blast door. A hero can interact with the blast door (3 {STRENGTH}) to open the passage.',
                'When the passage is open, the Rebels win!',
              ],
              title: 'Hidden Passage',
            });

            yield put(setMapStateVisible(1, 'neutral', true));
            yield put(updateRebelVictory('Open the blast door'));

            if (numberBombardments < MAX_BOMBARDMENTS) {
              yield call(helperEventModal, {
                story: REFER_CAMPAIGN_GUIDE,
                text: [
                  'The structure will now be bombarded.',
                ],
                title: 'Hidden Passage',
              });
              yield call(handleBombardment);
            }

            // Switch target
            if (!priorityTargetKillHero) {
              yield put(setMoveTarget(TARGET_BLAST_DOOR));
            }
          }

          yield put(createAction('INCOMING_INCREMENT_YELLOW_TERMINALS'));
          break;
        default:
          yield call(helperEventModal, {
            text: [
              'The terminal unfortunately was a decoy.',
            ],
            title: 'Incoming',
          });
          break;
      }
      track('incoming', 'interaction', 'terminal', color);
      yield put(createAction('INCOMING_SET_ACTIVATED_TERMINAL', {id}));
      yield put(setMapStateVisible(id, 'terminal', false));
    }
  }
}

function* handleHeroesEscape(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'neutral' && value === true) {
      yield put(displayModal('REBEL_VICTORY'));
      track('incoming', 'victory', 'escaped');
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
      track('incoming', 'defeat', 'wounded');
      break;
    }
    const isOneHeroLeft = yield select(getIsOneHeroLeft);
    if (isOneHeroLeft) {
      // Switch targets
      yield put(createAction('INCOMING_PRIORITY_TARGET_KILL_HERO', true));
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

    if (currentRound === 7) {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      track('incoming', 'defeat', 'round');
      break;
    }

    const {bombardmentFromCorridorDone, corridorEntered} = yield select(getState);
    if (corridorEntered && !bombardmentFromCorridorDone) {
      // Do bombardment
      yield call(helperEventModal, {
        text: [
          'The structure will now be bombarded.',
        ],
        title: 'Bombardment',
      });
      yield call(handleBombardment);
      yield put(createAction('INCOMING_SET_BOMBARDMENT_FROM_CORRIDOR'));
    }

    // Do pursuit event
    const {needToDoPursuitEvent} = yield select(getState);
    if (needToDoPursuitEvent) {
      yield call(
        helperDeploy,
        'The Imperial troops are hot on your tail.',
        ['Deploy an {ELITE}Elite Stormtrooper{END} group, {ELITE}Elite Imperial Officer{END}, and Imperial Officer to an interior deployment point if one exists. If not, the south western green deployment point.'],
        'Pursuit',
        ['stormtrooperElite', 'imperialOfficerElite', 'imperialOfficer']
      );
      yield put(createAction('INCOMING_SET_NEED_TO_DO_PURSUIT_EVENT', {value: false}))
    }

    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(helperInitialSetup, 'Stormtrooper, Trandoshan Hunter');
  yield call(helperMissionBriefing, [
    'Two of the terminals represent clues to the exit. The other two are decoys.',
    'A hero can interact with a terminal (3 {TECH} or {INSIGHT}) to reveal the color. If an Imperial figure is within 2 spaces of that hero, apply -1 {SURGE} to the results.',
  ]);
  yield call(helperEventModal, {
    text: [
      'The mission will proceed once a Rebel figure enters the Corridor.',
    ],
    title: 'Incoming',
  });
  yield put(missionSpecialSetupDone());
}

/*
Priority target definitions:
1) Initial attack is default, move is default
2) Once blast door opens, move is blast door
*/
export function* incoming(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
  yield put(setMoveTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN));

  yield all([
    fork(handleSpecialSetup),
    fork(handleCorridorEntered),
    fork(handleYellowTerminalRevealed),
    fork(handleHeroesEscape),
    fork(handleHeroesWounded),
    fork(handleRoundEnd),
  ]);

  track('missionStart', 'incoming');
  yield put(missionSagaLoadDone());
}
