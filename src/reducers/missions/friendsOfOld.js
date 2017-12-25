// @flow

import {
  addToRoster,
  enableEscape,
  getAreAllHeroesWounded,
  getEscapedRebels,
  getIsOneHeroLeft,
  getRosterOfType,
  getWoundedOther,
  SET_REBEL_ESCAPED,
  setRebelHpBoost,
  WOUND_REBEL_HERO,
  WOUND_REBEL_OTHER,
} from '../rebels';
import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {
  getCurrentRound,
  MISSION_SPECIAL_SETUP,
  missionSpecialSetupDone,
  SET_MAP_STATE_ACTIVATED,
  setAttackTarget,
  setDeploymentPoint,
  setMapStateActivated,
  setMapStateVisible,
  setMoveTarget,
  statusPhaseEndRoundEffectsDone,
  STATUS_PHASE_END_ROUND_EFFECTS,
} from '../mission';
import {OPTIONAL_DEPLOYMENT_DONE, optionalDeployment} from '../imperials';
import {TARGET_ENTRANCE_TOKEN, TARGET_HERO_CLOSEST_UNWOUNDED, TARGET_REMAINING} from './constants';
import createAction from '../createAction';
import difference from 'lodash/difference';
import {displayModal} from '../modal';
import {getMissionThreat} from '../app';
import helperDeploy from './helpers/helperDeploy';
import helperEventModal from './helpers/helperEventModal';
import helperIncreaseThreat from './helpers/helperIncreaseThreat';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import {missionSagaLoadDone} from '../app';
import random from 'lodash/random';
import shuffle from 'lodash/shuffle';
import type {StateType} from '../types';
import track from '../../lib/track';

// Constants

const TARGET_TROOPER = 'the closest Trooper';

const DEPLOYMENT_POINT_BOTTOM = 'The bottom green deployment point';

// Types

export type FriendsOfOldStateType = {
  activatedTokenIndexes: string[],
  escapedRebelTroopers: number,
  neturalTokens: string[],
  priorityTargetKillHero: boolean,
};

// State

const initialState = {
  activatedTokenIndexes: [],
  escapedRebelTroopers: 0,
  neturalTokens: shuffle(['red', 'blue', 'green', 'yellow']),
  priorityTargetKillHero: false,
};

export default (state: FriendsOfOldStateType = initialState, action: Object) => {
  switch (action.type) {
    case 'FRIENDS_OF_OLD_SET_ACTIVATED_TOKEN':
      return {
        ...state,
        activatedTokenIndexes: state.activatedTokenIndexes.concat([action.payload.id]),
      };
    case 'FRIENDS_OF_OLD_PRIORITY_TARGET_KILL_HERO':
      return {
        ...state,
        priorityTargetKillHero: action.payload,
      };
    default:
      return state;
  }
};

// Selectors

const getState = (state: StateType) => state.friendsOfOld;
export const getFriendsOfOldGoalText = (state: StateType): string[] => {
  const goals = [
    '{BOLD}Rebel Mission Tokens:{END}',
    'A hero can interact ({INSIGHT}) to reveal and replace with a Rebel Trooper.',
    '{BREAK}',
    `Each Rebel Trooper gains ${
      state.app.missionThreat
    } health. They can only move once each activation.`,
    '{BREAK}',
    'All Troopers share a single deployment card.',
    '{BREAK}',
    'A Trooper can escape through the entrance.',
    '{BREAK}',
    '{BOLD}After Round 4:{END}',
    `A Trooper will be revealed at random and suffers ${
      state.app.missionThreat
    } {DAMAGE} and is stunned.`,
  ];

  return goals;
};

// Sagas

function* handleTheSquad(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    const {activatedTokenIndexes, neturalTokens} = yield select(getState);
    const missionThreat = yield select(getMissionThreat);

    if (!activatedTokenIndexes.includes(id) && type === 'neutral' && value === true) {
      // Check which color is revealed
      const color = neturalTokens[id - 1];
      // Logic based on color
      switch (color) {
        case 'red':
          track('friendsOfOld', 'theSquad', 'red');
          yield call(
            helperDeploy,
            'Upon hearing your signal the Rebel Trooper springs out from his hiding place.',
            [
              'Replace the red mission token with a Rebel Trooper.',
              'A hero within 3 spaces of this Trooper recovers 5 {DAMAGE}.',
              'Deploy a Stormtrooper group to the nearest green deployment point.',
            ],
            'The Squad',
            ['stormtrooper']
          );
          // Deploy a rebel trooper where the map state was
          yield put(setMapStateVisible(id, 'neutral', false));
          yield put(addToRoster('missionFriendsOfOldRebelTrooperR'));
          yield put(setRebelHpBoost('missionFriendsOfOldRebelTrooperR', missionThreat));
          // Switch targets
          yield put(setAttackTarget(TARGET_TROOPER));
          yield put(setMoveTarget(TARGET_ENTRANCE_TOKEN));
          break;
        case 'blue':
          track('friendsOfOld', 'theSquad', 'blue');
          yield call(helperEventModal, {
            story: 'Upon hearing your signal the Rebel Trooper springs out from his hiding place.',
            text: [
              'Replace the blue mission token with a Rebel Trooper.',
              'This Trooper becomes focused and can immediately interrupt to perform an attack.',
              'The threat has been increased.',
            ],
            title: 'The Squad',
          });
          yield call(helperIncreaseThreat, 1);
          // Deploy a rebel trooper where the map state was
          yield put(setMapStateVisible(id, 'neutral', false));
          yield put(addToRoster('missionFriendsOfOldRebelTrooperB'));
          yield put(setRebelHpBoost('missionFriendsOfOldRebelTrooperB', missionThreat));
          // Switch targets
          yield put(setAttackTarget(TARGET_TROOPER));
          yield put(setMoveTarget(TARGET_ENTRANCE_TOKEN));
          break;
        case 'green':
          track('friendsOfOld', 'theSquad', 'green');
          yield call(
            helperDeploy,
            'Upon hearing your signal the Rebel Trooper springs out from his hiding place.',
            [
              'Replace the green mission token with a Rebel Trooper.',
              'The active Hero may immediately interrupt to perform a move or attack.',
              'Deploy a Probe Droid to the nearest green deployment point.',
            ],
            'The Squad',
            ['probeDroid']
          );
          // Deploy a rebel trooper where the map state was
          yield put(setMapStateVisible(id, 'neutral', false));
          yield put(addToRoster('missionFriendsOfOldRebelTrooperG'));
          yield put(setRebelHpBoost('missionFriendsOfOldRebelTrooperG', missionThreat));
          // Switch targets
          yield put(setAttackTarget(TARGET_TROOPER));
          yield put(setMoveTarget(TARGET_ENTRANCE_TOKEN));
          break;
        case 'yellow':
          track('friendsOfOld', 'theSquad', 'yellow');
          yield call(
            helperDeploy,
            "It's a trap!",
            [
              'Replace the yellow mission token with an {ELITE}Elite Imperial Officer{END}.',
              'The {ELITE}Imperial Officer{END} may interrupt to perform an attack on the nearest Rebel Trooper.',
              'If no Rebel Troopers are in attack range, the {ELITE}Imperial Officer{END} moves towards the entrance.',
            ],
            'The Squad',
            ['imperialOfficerElite']
          );
          yield put(setMapStateVisible(id, 'neutral', false));
          // Switch targets
          yield put(setAttackTarget(TARGET_TROOPER));
          yield put(setMoveTarget(TARGET_ENTRANCE_TOKEN));
          break;
        default:
          break;
      }
      yield put(createAction('FRIENDS_OF_OLD_SET_ACTIVATED_TOKEN', {id}));
    }
  }
}

function* handleTrooperDefeated(): Generator<*, *, *> {
  while (true) {
    yield take(WOUND_REBEL_OTHER);
    const woundedOther = yield select(getWoundedOther);
    if (woundedOther.length >= 2) {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      track('friendsOfOld', 'defeat', 'troopers');
      break;
    }

    // Need to maybe change the target if no troopers exist anymore
    const missionUnits = yield select(getRosterOfType, 'mission');
    if (missionUnits.length === 0) {
      yield put(setAttackTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
      yield put(setMoveTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
    }
  }
}

function* handleTrooperEscaped(): Generator<*, *, *> {
  while (true) {
    yield take(SET_REBEL_ESCAPED);
    const escapedRebels = yield select(getEscapedRebels);
    if (escapedRebels.length >= 2) {
      // End game with rebel victory
      yield put(displayModal('REBEL_VICTORY'));
      track('friendsOfOld', 'victory', 'escaped');
      break;
    }

    // Need to maybe change the target if no troopers exist anymore
    const missionUnits = yield select(getRosterOfType, 'mission');
    if (missionUnits.length === 0) {
      yield put(setAttackTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
      yield put(setMoveTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
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
      track('friendsOfOld', 'defeat', 'wounded');
      break;
    }
    const isOneHeroLeft = yield select(getIsOneHeroLeft);
    if (isOneHeroLeft) {
      // SWITCH TARGET
      yield put(createAction('FRIENDS_OF_OLD_PRIORITY_TARGET_KILL_HERO', true));
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
    const missionThreat = yield select(getMissionThreat);
    const {activatedTokenIndexes} = yield select(getState);

    if (currentRound >= 4 && activatedTokenIndexes.length < 4) {
      // Manually send the token activated action
      // Figure out which index first
      const allIndexes = [1, 2, 3, 4];
      const indexesYetToActivate = difference(allIndexes, activatedTokenIndexes);

      // Grab a random one from the indexes yet to activate
      const randomIndex = random(0, indexesYetToActivate.length - 1);
      const indexToUse = indexesYetToActivate[randomIndex];

      // Do the action
      yield call(helperEventModal, {
        text: [
          `A mission token will now be randomly flipped. If a Rebel Trooper is revealed, that Trooper suffers ${
            missionThreat
          } {DAMAGE} and is stunned.`,
        ],
        title: 'The Squad',
      });
      yield put(setMapStateActivated(indexToUse, 'neutral', true));
      yield take('FRIENDS_OF_OLD_SET_ACTIVATED_TOKEN');
    }

    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  const missionThreat = yield select(getMissionThreat);
  yield call(helperInitialSetup, 'Imperial Officer, Stormtrooper');
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
    'Neutral mission tokens are hidden rebels. A hero can interact ({INSIGHT}) with a token to reveal it and replace it with a Rebel Trooper. Rebel Troopers are allies.',
    `Each Trooper gains ${
      missionThreat
    } Health. Rebel Troopers can only move once each activation.`,
    'All Rebel Troopers share a single deployment card! If a Trooper is revealed after the group has already activated, they must wait until the next turn to activate.',
    'A Rebel Trooper can escape through the entrance.',
    `Starting with round 4, at the end of the round, one mission token is flipped at random and replaced with a Rebel Trooper. This figure suffers ${
      missionThreat
    } {DAMAGE} and is stunned.`,
  ]);
  // Enable escaping
  yield put(enableEscape());
  yield put(missionSpecialSetupDone());
}

/*
Priority target definitions:
1) Initial is unwounded hero, move is unwounded hero
2) If Rebel token flipped, attack is that rebel, move is the entrance
3) At any point if heroes - 1 are wounded, target is the last remaining hero
*/

export function* friendsOfOld(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
  yield put(setMoveTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_BOTTOM));

  yield all([
    fork(handleSpecialSetup),
    fork(handleTheSquad),
    fork(handleTrooperDefeated),
    fork(handleTrooperEscaped),
    fork(handleHeroesWounded),
    fork(handleRoundEnd),
  ]);

  track('missionStart', 'friendsOfOld');
  yield put(missionSagaLoadDone());
}
