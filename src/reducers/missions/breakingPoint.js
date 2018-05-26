// @flow

import {
  ACTIVATION_PHASE_BEGIN,
  changePlayerTurn,
  getCurrentRound,
  MISSION_SPECIAL_SETUP,
  missionSpecialSetupDone,
  PLAYER_IMPERIALS,
  SET_MAP_STATE_ACTIVATED,
  setAttackTarget,
  setDeploymentPoint,
  setMoveTarget,
  STATUS_PHASE_END_ROUND_EFFECTS,
  statusPhaseEndRoundEffectsDone,
} from '../mission';
import {addToRoster, getAllyChosen, getRosterOfType, SET_REBEL_ACTIVATED} from '../rebels';
import {all, call, fork, put, select, spawn, take} from 'redux-saga/effects';
import {
  getLastDeployedGroupOfId,
  isGroupIdInDeployedGroups,
  OPTIONAL_DEPLOYMENT_DONE,
  optionalDeployment,
  silentSetImperialGroupActivated,
} from '../imperials';
import {getMissionThreat, missionSagaLoadDone} from '../app';
import createAction from '../createAction';
import {displayModal} from '../modal';
import handleHeroesWounded from './sharedSagas/handleHeroesWounded';
import handleStatusPhaseBegin from './sharedSagas/handleStatusPhaseBegin';
import helperCheckMapStateActivations from './helpers/helperCheckMapStateActivations';
import helperDeploy from './helpers/helperDeploy';
import helperEventModal from './helpers/helperEventModal';
import helperIncreaseThreat from './helpers/helperIncreaseThreat';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import helperShowInterruptedGroup from './helpers/helperShowInterruptedGroup';
import lowerFirst from 'lodash/lowerFirst';
import type {StateType} from '../types';
import {REFER_CAMPAIGN_GUIDE} from './constants';
import roll from '../../lib/roll';
import track from '../../lib/track';

// Constants

const TARGET_SUPPLY_CACHE = 'the nearest supply cache';

const DEPLOYMENT_POINT_GREEN_WEST = 'The western green deployment point';
const DEPLOYMENT_POINT_GREEN_EAST = 'The eastern green deployment point';

// Types

export type BreakingPointStateType = {
  championDeployed: boolean,
  priorityTargetKillHero: boolean,
};

// State

const initialState = {
  championDeployed: false,
  priorityTargetKillHero: false,
};

export default (state: BreakingPointStateType = initialState, action: Object) => {
  switch (action.type) {
    case 'BREAKING_POINT_PRIORITY_TARGET_KILL_HERO':
      return {
        ...state,
        priorityTargetKillHero: action.payload,
      };
    case 'BREAKING_POINT_CHAMPION_DEPLOYED':
      return {
        ...state,
        championDeployed: true,
      };
    default:
      return state;
  }
};

// Selectors

export const getBreakingPointGoalText = (state: StateType): string[] => {
  let goals = [];

  goals = goals.concat([
    '{BOLD}Activation Order:{END}',
    'The Imperials will have first activation each round.',
    '{BREAK}',
    '{BOLD}Supply Caches:{END}',
    `Health: ${state.app.missionThreat * 2}, Defense: {BLOCK} number of adjacent Rebel figures`,
    '{BREAK}',
    '{BOLD}Barricades:{END}',
    'Neutral mission tokens are impassible barricades.',
    '{BREAK}',
    '{BOLD}Doors:{END}',
    'Doors are locked. An Imperial figure can attack to open (Health: 5, Defense: 1 {BLOCK})',
    '{BREAK}',
    'A door adjacent to a Rebel figure does not block LOS.',
  ]);

  if (state.breakingPoint.championDeployed) {
    goals = goals.concat([
      '{BREAK}',
      '{BOLD}Royal Guard Champion:{END}',
      "Performs 1 action at the end of each heroes' turn.",
    ]);
  }

  return goals;
};

// Sagas

function getRandomDeploymentPoint() {
  if (roll(50)) {
    return DEPLOYMENT_POINT_GREEN_WEST;
  }

  return DEPLOYMENT_POINT_GREEN_EAST;
}

function* handleLeaveNoSurvivors(): Generator<*, *, *> {
  track('breakingPoint', 'leaveNoSurvivors', 'triggered');

  yield call(
    helperDeploy,
    'Leave No Survivors',
    REFER_CAMPAIGN_GUIDE,
    ['A Royal Guard Champion will now be deployed.'],
    ['royalGuardChampion', `Deploy to ${lowerFirst(getRandomDeploymentPoint())}. Instead of activating as normal, the Royal Guard Champion performs 1 action after each hero activation.`]
  );

  // Manually set him as activated so he doesn't activate as normal after this time
  const group = yield select(getLastDeployedGroupOfId, 'royalGuardChampion');
  yield put(silentSetImperialGroupActivated(group));

  yield put(createAction('BREAKING_POINT_CHAMPION_DEPLOYED'));

  // Need to spawn to not block caller
  yield spawn(handleRoyalGuardChampionActivations);
}

function* handleArtillerySupport(): Generator<*, *, *> {
  const dmgText =
    'Choose a space on the board that affects the most Rebel figures within 3 spaces of the chosen spot. Roll 1 red die and deal damage to each Rebel figure in range.';
  const stunText =
    'Choose a space on the board that affects the most Rebel figures within 3 spaces of the chosen spot. Each figure tests {STRENGTH}. Each figure that fails is stunned.';

  yield call(helperEventModal, {
    text: [roll(50) ? dmgText : stunText],
    title: 'Artillery Support',
  });
}

function* handleRoyalGuardChampionActivations(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_REBEL_ACTIVATED);
    const {id} = action.payload;
    const roster = yield select(getRosterOfType, 'hero');
    const championDeployed = yield select(isGroupIdInDeployedGroups, 'royalGuardChampion');
    // Only interrupt if a hero was activated and if Royal Guard Champion is still alive
    if (roster.includes(id) && championDeployed) {
      yield call(helperShowInterruptedGroup, 'royalGuardChampion');
    }
  }
}

function* handleCacheDestroyed(): Generator<*, *, *> {
  while (true) {
    yield take(SET_MAP_STATE_ACTIVATED);
    const minimumDestroyed = yield call(
      helperCheckMapStateActivations,
      ['rebel-1', 'rebel-2', 'rebel-3', 'rebel-4', 'rebel-5', 'rebel-6', 'rebel-7', 'rebel-8'],
      5
    );
    if (minimumDestroyed) {
      yield put(displayModal('IMPERIAL_VICTORY'));
      track('breakingPoint', 'defeat', 'supplyCache');
      // We're done
      break;
    }
  }
}

function* handleRoundStart(): Generator<*, *, *> {
  while (true) {
    yield take(ACTIVATION_PHASE_BEGIN);
    // Need to change the turn to the imperials since they get to move first each round
    yield put(changePlayerTurn(PLAYER_IMPERIALS));
    // If Royal Guard Champion is deployed, we need to manually exhaust him so he doesn't take
    // his usual turn
    const championDeployed = yield select(isGroupIdInDeployedGroups, 'royalGuardChampion');
    if (championDeployed) {
      const group = yield select(getLastDeployedGroupOfId, 'royalGuardChampion');
      yield put(silentSetImperialGroupActivated(group));
    }
  }
}

// REQUIRED SAGA
function* handleRoundEnd(): Generator<*, *, *> {
  while (true) {
    yield take(STATUS_PHASE_END_ROUND_EFFECTS);
    const currentRound = yield select(getCurrentRound);

    if (currentRound === 1) {
      yield call(handleLeaveNoSurvivors);
    } else if (currentRound === 5) {
      // End game with rebel victory
      yield put(displayModal('REBEL_VICTORY'));
      track('breakingPoint', 'victory', 'round');
      break;
    } else {
      yield call(handleArtillerySupport);
    }

    // Change deployment point to a random one at the end of each round
    yield put(setDeploymentPoint(getRandomDeploymentPoint()));

    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(helperInitialSetup, ['royalGuard']);

  yield call(helperEventModal, {
    text: ['The threat has been increased.', 'An optional deployment will now be done.'],
    title: 'Initial Setup',
  });
  // Double current threat
  yield call(helperIncreaseThreat, 2);
  // Do optional deployment
  yield put(optionalDeployment());
  yield take(OPTIONAL_DEPLOYMENT_DONE);

  const missionThreat = yield select(getMissionThreat);
  yield call(helperMissionBriefing, [
    `Rebel mission tokens are supply caches. An Imperial figure can attack to destroy them (Health: ${missionThreat *
      2}, Defense: {BLOCK} equal to the number of adjacent Rebel figures)`,
    'Neutral mission tokens are impassible barricades.',
    'Doors are locked. An Imperial figure can attack to open (Health: 5, Defense: 1 {BLOCK}',
    'A door adjacent to a Rebel figure does not block LOS.',
    'The Imperials will have first activation each round.',
  ]);
  yield call(helperEventModal, {
    text: [
      'The rebels control the Rebel Troopers as allies for no additional cost.',
      'The rebels can deploy to any empty space.',
    ],
    title: 'Initial Setup',
  });

  // If the rebel player has not deployed the Rebel Troopers, we will give them the troopers for free
  const allyChosen = yield select(getAllyChosen);
  if (allyChosen !== 'rebelTrooper') {
    yield put(addToRoster('rebelTrooper'));
  }

  yield put(missionSpecialSetupDone());
}

/*
Priority target definitions:
1) Initial attack is supply cache, move is supply cache
*/
export function* breakingPoint(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_SUPPLY_CACHE));
  yield put(setMoveTarget(TARGET_SUPPLY_CACHE));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(getRandomDeploymentPoint()));

  yield all([
    fork(handleSpecialSetup),
    fork(handleCacheDestroyed),
    fork(handleHeroesWounded('breakingPoint', 'BREAKING_POINT_PRIORITY_TARGET_KILL_HERO')),
    fork(handleRoundStart),
    fork(handleStatusPhaseBegin),
    fork(handleRoundEnd),
  ]);

  track('missionStart', 'breakingPoint');
  yield put(missionSagaLoadDone());
}
