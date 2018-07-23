// @flow

import {addSingleUnitToRoster, addToRoster, getRosterOfType, WOUND_REBEL_OTHER} from '../rebels';
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
import {OPTIONAL_DEPLOYMENT_DONE, optionalDeployment} from '../imperials';
import {
  REFER_CAMPAIGN_GUIDE,
  STRING_WITHDRAW_INCAPACITATED,
  TARGET_HERO_CLOSEST_UNWOUNDED,
} from './constants';
import createAction from '../createAction';
import {displayModal} from '../modal';
import handleStatusPhaseBegin from './sharedSagas/handleStatusPhaseBegin';
import helperCheckMapStateActivations from './helpers/helperCheckMapStateActivations';
import helperDeploy from './helpers/helperDeploy';
import helperEventModal from './helpers/helperEventModal';
import helperIncreaseThreat from './helpers/helperIncreaseThreat';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import {missionSagaLoadDone} from '../app';
import type {RebelUnitType} from '../rebels';
import type {StateType} from '../types';
import track from '../../lib/track';

// Constants

const MISSION_NAME = 'braceForImpact';
// const MISSION_NAME_S = snakeCase(MISSION_NAME).toUpperCase();

const TARGET_REBEL_TROOPER = 'the closest Rebel Trooper (or barricade if not reachable)';
const TARGET_BARRICADE = 'the Rebel Barricade (tile 06A)';
const DEPLOYMENT_POINT_GREEN_S = 'The south green deployment point';
const DEPLOYMENT_POINT_BARRICADE = 'The Rebel Barricade (tile 06A)';

// Types

export type BraceForImpactStateType = {
  currentRoundTokensDiscarded: number,
  dataDownloaded: boolean,
  reinforcementsLeft: number,
};

// State

const initialState = {
  currentRoundTokensDiscarded: 0,
  dataDownloaded: false,
  reinforcementsLeft: 4,
};

const getState = (state: StateType) => state[MISSION_NAME];
export default (state: BraceForImpactStateType = initialState, action: Object) => {
  switch (action.type) {
    case 'BRACE_FOR_IMPACT_TROOPER_KILLED':
      if (state.reinforcementsLeft > 0) {
        return {
          ...state,
          currentRoundTokensDiscarded: state.currentRoundTokensDiscarded + 1,
          reinforcementsLeft: state.reinforcementsLeft - 1,
        };
      }
      return state;
    case 'BRACE_FOR_IMPACT_REINFORCE':
      return {
        ...state,
        currentRoundTokensDiscarded: 0,
      };
    case 'BRACE_FOR_IMPACT_DATA_DOWNLOADED':
      return {
        ...state,
        dataDownloaded: true,
      };
    default:
      return state;
  }
};

// Selectors

export const getBraceForImpactGoalText = (state: StateType): string[] => {
  let goals = [];

  if (!state.braceForImpact.dataDownloaded) {
    goals = goals.concat([
      '{BOLD}Current Goal:{END}',
      'Download the data from the terminal (2 {TECH}) (T1).',
      '{BREAK}',
    ]);
  } else {
    goals = goals.concat([
      '{BOLD}Departing:{END}',
      'When all heroes are on or adjacent to the entrance, they may depart.',
      '{BREAK}',
      '---PLACEHOLDER_BUTTON_1---',
      '{BREAK}',
    ]);
  }

  goals = goals.concat([
    '{BOLD}Reinforcements:{END}',
    'Neutral mission tokens. A token is discarded when a Rebel Trooper is defeated.',
    'At end of each round, a Rebel Trooper will be deployed for each discarded token.',
    '{BREAK}',
    `{BOLD}Tokens Discarded This Round{END}: ${state.braceForImpact.currentRoundTokensDiscarded}`,
    `{BOLD}Tokens Left{END}: ${state.braceForImpact.reinforcementsLeft}`,
    '{BREAK}',
    '{BOLD}Barricades:{END}',
    'Rebel mission tokens. Impassable terrain for Imperials. Imperials can attack (Health: 8, Defense: 1 {BLOCK}).',
    'When defending, Rebel Troopers can pick a barricade which LOS was traced to add 1 black die to defending. The barricade suffers {DAMAGE} equal to the result of the black die.',
    '{BREAK}',
    '{BOLD}Doors:{END}',
    'Locked to Imperial figures.',
    '{BREAK}',
    '{BOLD}Withdrawn hero:{END}',
    'Withdrawn heroes receive only 1 action and they can only move.',
    '{BREAK}',
  ]);

  return goals;
};

// Sagas

function* handleFinishThem(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'door' && value === true) {
      track(MISSION_NAME, 'finishThem', 'triggered');
      yield call(helperIncreaseThreat, 1);
      yield call(
        helperDeploy,
        'Finish Them',
        "The Imperial troops spring out from their hiding place... it's a trap!",
        [
          'The threat has been increased by the threat level.',
          'A Probe Droid and a Royal Guard group will now be deployed.',
        ],
        ['probeDroid', 'Deploy to the red deployment point.'],
        ['royalGuard', 'Deploy to the red deployment point.']
      );
    }
  }
}

function* handleAlarm(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'terminal' && value === true) {
      track(MISSION_NAME, 'alarm', 'triggered');
      yield call(helperIncreaseThreat, 1);
      yield call(helperEventModal, {
        story: REFER_CAMPAIGN_GUIDE,
        text: [
          'The threat has been increased by the threat level.',
          'When all heroes are on or adjacent to the Entrance, they can depart to win.',
        ],
        title: 'Alarm',
      });
      yield put(createAction('BRACE_FOR_IMPACT_DATA_DOWNLOADED'));
    }
  }
}

function* handleStormTheBarricade(): Generator<*, *, *> {
  while (true) {
    yield take(SET_MAP_STATE_ACTIVATED);
    const allActivated = yield call(helperCheckMapStateActivations, ['rebel-1', 'rebel-2'], 2);
    if (allActivated) {
      yield put(setDeploymentPoint(DEPLOYMENT_POINT_BARRICADE));
      // We're done
      break;
    }
  }
}

function* handleHeroesDepart(): Generator<*, *, *> {
  yield take('BRACE_FOR_IMPACT_HEROES_DEPART');
  yield put(displayModal('REBEL_VICTORY'));
  track(MISSION_NAME, 'victory', 'depart');
}

function* handleRebelTrooperKilled(): Generator<*, *, *> {
  while (true) {
    const action = yield take(WOUND_REBEL_OTHER);
    const {id} = action.payload;
    if (id === 'rebelTrooper') {
      yield put(createAction('BRACE_FOR_IMPACT_TROOPER_KILLED'));

      // Check if no more troopers or reinforcements. If so, Imperials win
      const {currentRoundTokensDiscarded, reinforcementsLeft} = yield select(getState);
      const allies = yield select(getRosterOfType, 'ally');
      const troopers = allies.filter((unit: RebelUnitType) => unit.id === 'rebelTrooper');

      // No more tokens and no deployed troopers
      if (currentRoundTokensDiscarded === 0 && reinforcementsLeft === 0 && troopers.length === 0) {
        yield put(displayModal('IMPERIAL_VICTORY'));
        track(MISSION_NAME, 'defeat', 'round');
      }

      // If no more deployed troopers make sure to switch the target so we don't keep trying to kill them
      // Until next round that is
      if (troopers.length === 0) {
        yield put(setAttackTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
      }
    }
  }
}

function* handleTokenReinforcements(): Generator<*, *, *> {
  const {currentRoundTokensDiscarded} = yield select(getState);
  if (currentRoundTokensDiscarded > 0) {
    for (let i = 0; i < currentRoundTokensDiscarded; i++) {
      yield put(addSingleUnitToRoster('rebelTrooper'));
    }

    yield call(helperEventModal, {
      text: [
        `${currentRoundTokensDiscarded} Rebel Troopers were reinforced due to discarded mission tokens.`,
        'Deploy the Troopers to the Rebel Barricade (tile 06A)',
      ],
      title: 'Rebel Trooper Reinforcement',
    });

    // Target the troopers again if we stopped targeting them
    yield put(setAttackTarget(TARGET_REBEL_TROOPER));

    yield put(createAction('BRACE_FOR_IMPACT_REINFORCE'));
  }
}

// REQUIRED SAGA
function* handleRoundEnd(): Generator<*, *, *> {
  while (true) {
    yield take(STATUS_PHASE_END_ROUND_EFFECTS);
    const currentRound = yield select(getCurrentRound);

    // Handle reinforcements
    yield call(handleTokenReinforcements);

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
  yield call(helperInitialSetup, ['nexu', 'stormtrooper', 'stormtrooperElite']);
  yield call(helperEventModal, {
    text: [
      'The heroes control the Rebel Troopers as an ally at no additional cost.',
      'Claim 4 neutral mission tokens and set them aside.',
      'The threat has been increased.',
      'An optional deployment will now be done.',
    ],
    title: 'Initial Setup',
  });
  // Double current threat
  yield call(helperIncreaseThreat, 2);
  // Do optional deployment
  yield put(optionalDeployment());
  yield take(OPTIONAL_DEPLOYMENT_DONE);

  // Deploy Rebel Saboteurs
  yield put(addToRoster('rebelTrooper'));

  yield call(helperMissionBriefing, [
    'Rebel mission tokens are barricades. They are impassable terrain and can be attacked (Health: 8, Defense: 1 {BLOCK}). Rebel figures can move through barricades as normal terrain.',
    'While defending, Rebel Troopers can choose a barricade through which LOS was traced to add 1 black die to defending. The barricade suffers {DAMAGE} equal to the roll results of that die.',
    'Neutral mission tokens are reinforcements. When a Rebel Trooper is defeated, discard a token. At the end of each round, deploy one Rebel Trooper to the Rebel Barricade (tile 06A) for each token discarded that round.',
    'The door is locked to Imperial figures.',
    STRING_WITHDRAW_INCAPACITATED,
    'A hero can interact with the terminal (2 {TECH}) to download the data. When the data has been downloaded and all heores are on or adjacent to the Entrance, the heroes can depart.',
  ]);
  yield put(missionSpecialSetupDone());
}

/*
Rebels win if heroes can get to the terminal, use it, and get back
Imperial wins if he can take out all of the troopers but he needs to stop the heroes also from reaching the terminal
otherwise if he just focuses on the troopers then the heroes are just going to waltz through and waltz out
3 initial troops, 4 reinforcements so best case kill 3 in R1, 3 in R2, 1 in R3 so 3 rounds to kill everything which is probably not likely
2 in R1, reinforce 2 so 2 in R2, reinforce 2, 2 in R3, 1 in R4. so killing 2 each round is four rounds.
so average 4 rounds to kill 2 each round.
also the troopers can hide in the corner and not be able to be hit so need to knock the barricade down if not reachable
probably not possible to take out all heroes before they can flip the terminal to stop them from being able to use the terminal
so given that, is there a point even bothering with the heroes then? since 1 hero has to make it to the terminal and
the rest have to get back to the entrance. going to take a few rounds to accomplish that.
the fastest hero with 5 speed will take 4 rounds to get to the terminal and back assuming they do nothing but use the terminal and move and open doors.
so maybe just focus on the troopers and kill as many as possible.

so, attack target: the closest Rebel Trooper (or barricade if no LOS)
move target: the Rebel Barricade (tile 06A)
*/
export function* braceForImpact(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_REBEL_TROOPER));
  yield put(setMoveTarget(TARGET_BARRICADE));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN_S));

  yield all([
    fork(handleSpecialSetup),
    fork(handleFinishThem),
    fork(handleAlarm),
    fork(handleStormTheBarricade),
    fork(handleHeroesDepart),
    fork(handleRebelTrooperKilled),
    fork(handleStatusPhaseBegin),
    fork(handleRoundEnd),
  ]);

  track('missionStart', MISSION_NAME);
  yield put(missionSagaLoadDone());
}
