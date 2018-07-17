// @flow

import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {
  getCurrentGroups,
  getVillains,
  OPTIONAL_DEPLOYMENT_DONE,
  optionalDeployment,
} from '../imperials';
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
import {getExpansions, getMissionThreat, missionSagaLoadDone} from '../app';
import type {ImperialUnitType, UnitConfigType} from '../imperials';
import {addToRoster} from '../rebels';
import createAction from '../createAction';
import createSubgroup from '../utils/createSubgroup';
import {displayModal} from '../modal';
import getAvailableUnitList from '../utils/getAvailableUnitList';
import getRandomItem from '../utils/getRandomItem';
import handleHeroesWounded from './sharedSagas/handleHeroesWounded';
import handleStatusPhaseBegin from './sharedSagas/handleStatusPhaseBegin';
import helperCheckMapStateActivations from './helpers/helperCheckMapStateActivations';
import helperDeploy from './helpers/helperDeploy';
import helperEventModal from './helpers/helperEventModal';
import helperIncreaseThreat from './helpers/helperIncreaseThreat';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import missions from '../../data/missions';
import type {StateType} from '../types';
import {TARGET_CLOSEST_REBEL} from './constants';
import track from '../../lib/track';
import units from '../../data/units';

// Constants

const TARGET_TOKEN = 'the nearest reachable active informant or terminal';
const TARGET_LAST_TOKEN = 'the last informant or termianl in danger';

const DEPLOYMENT_POINT_GREEN_W = 'The west green deployment point';
const DEPLOYMENT_POINT_GREEN_E = 'The east green deployment point';
const DEPLOYMENT_POINT_G_Y =
  'The green or yellow deployment point closest to an informant or terminal in danger';
const DEPLOYMENT_POINT_G_B =
  'The green or blue deployment point closest to an informant or terminal in danger';
const DEPLOYMENT_POINT_G_Y_B =
  'The green, blue, or yellow deployment point closest to an informant or terminal in danger';
const DEPLOYMENT_POINT_RED = 'The red deployment point';

// Types

export type ShadyDealingsStateType = {
  cantinaPatrol: string[],
  cantinaPatrolDeployed: boolean,
  junkShopPatrol: string[],
  junkShopPatrolDeployed: boolean,
  priorityTargetKillHero: boolean,
};

// State

const initialState = {
  cantinaPatrol: [],
  cantinaPatrolDeployed: false,
  junkShopPatrol: [],
  junkShopPatrolDeployed: false,
  priorityTargetKillHero: false,
};

export default (state: ShadyDealingsStateType = initialState, action: Object) => {
  switch (action.type) {
    case 'SHADY_DEALINGS_PRIORITY_TARGET_KILL_HERO':
      return {
        ...state,
        priorityTargetKillHero: action.payload,
      };
    case 'SHADY_DEALINGS_SET_CANTINA_PATROL':
      return {
        ...state,
        cantinaPatrol: action.payload.cantinaPatrol,
      };
    case 'SHADY_DEALINGS_SET_CANTINA_PATROL_DEPLOYED':
      return {
        ...state,
        cantinaPatrolDeployed: true,
      };
    case 'SHADY_DEALINGS_SET_JUNK_SHOP_PATROL':
      return {
        ...state,
        junkShopPatrol: action.payload.junkShopPatrol,
      };
    case 'SHADY_DEALINGS_SET_JUNK_SHOP_PATROL_DEPLOYED':
      return {
        ...state,
        junkShopPatrolDeployed: true,
      };
    default:
      return state;
  }
};

// Selectors

const getState = (state: StateType) => state.shadyDealings;
export const getShadyDealingsGoalText = (state: StateType): string[] => {
  let goals = [];

  goals = goals.concat([
    '{BOLD}Restrictions:{END}',
    `A hero cannot interact with a terminal or informant if there is a figure from a patrol within 4 spaces of that object.`,
    '{BREAK}',
    '{BOLD}Doors:{END}',
    'Locked. A hero can interact ({STRENGTH} or {TECH}) to open. A Rebel figure can attack (Health: 5, Defense: None) to open.',
    '{BREAK}',
    '{BOLD}Mission Tokens (Informants):{END}',
    'A hero can interact (2 {INSIGHT} or {STRENGTH}) to claim.',
    '{BREAK}',
    '{BOLD}Terminals:{END}',
    'A hero can interact (2 {INSIGHT} or {TECH}) to claim.',
  ]);

  return goals;
};

// Sagas

function getRandomDeploymentPoint() {
  return getRandomItem(DEPLOYMENT_POINT_GREEN_W, DEPLOYMENT_POINT_GREEN_E);
}

function* setupPatrols(): Generator<*, *, *> {
  // Need to create our 2 patrols now
  // We need to pick from all units minus open groups, initial groups, and reserve groups
  // and non-creatures up to threat level 2 * missionThreat
  // Since there can be multiple of each type, we need to build a complete list of every single
  // deployment card, then remove all the ones we've picked so we know which ones we can pick
  // This exhaustive list has to take into account habitat and creature restrictions as well
  // as which villains the imperial player has earned
  // This is a LOT of work just to pick some units. Is there an easier way to do this?
  // Problem is we can't just pick units at random since we can't pick something the Imperial player
  // hasn't earned, cannot play (habitat restriction), or there are no more deployments of in
  // open, initial, and reserved groups.
  const missionThreat = yield select(getMissionThreat);
  const expansions = yield select(getExpansions);
  const villains = yield select(getVillains);
  const {openGroups} = yield select(getCurrentGroups);
  const unitsToExclude = openGroups.map((unit: ImperialUnitType) => unit.id);

  const unitList = yield call(
    getAvailableUnitList,
    missions.shadyDealings,
    units,
    unitsToExclude,
    missionThreat,
    expansions,
    villains
  );

  const cantinaPatrol = yield call(
    createSubgroup,
    unitList,
    missionThreat * 2,
    (unit: UnitConfigType) => !unit.attributes.includes('creature')
  );
  yield put(
    createAction('SHADY_DEALINGS_SET_CANTINA_PATROL', {
      cantinaPatrol: cantinaPatrol.map((unit: UnitConfigType) => unit.id),
    })
  );

  // Remove cantinaPatrol units from the unitList before building the next patrol
  for (let i = 0; i < cantinaPatrol.length; i++) {
    const index = unitList.findIndex((unit: UnitConfigType) => unit.id === cantinaPatrol[i]);
    if (index !== -1) {
      // Splice and create a new array with that one index removed
      unitList.splice(index, 1);
    }
  }

  const junkShopPatrol = yield call(
    createSubgroup,
    unitList,
    missionThreat * 2,
    (unit: UnitConfigType) => !unit.attributes.includes('creature')
  );
  yield put(
    createAction('SHADY_DEALINGS_SET_JUNK_SHOP_PATROL', {
      junkShopPatrol: junkShopPatrol.map((unit: UnitConfigType) => unit.id),
    })
  );
}

function* calculateDeploymentPoints(): Generator<*, *, *> {
  const {cantinaPatrolDeployed, junkShopPatrolDeployed} = yield select(getState);

  if (cantinaPatrolDeployed && !junkShopPatrolDeployed) {
    yield put(setDeploymentPoint(DEPLOYMENT_POINT_G_Y));
  } else if (junkShopPatrolDeployed && !cantinaPatrolDeployed) {
    yield put(setDeploymentPoint(DEPLOYMENT_POINT_G_B));
  } else if (cantinaPatrolDeployed && junkShopPatrolDeployed) {
    yield put(setDeploymentPoint(DEPLOYMENT_POINT_G_Y_B));
  }
}

function* handleCantinaPatrol(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if ([1, 2].includes(id) && type === 'door' && value === true) {
      track('shadyDealings', 'cantinaPatrol', 'triggered');

      const {cantinaPatrol} = yield select(getState);
      const adaptedPatrol = cantinaPatrol.map((id: string) => [
        id,
        'Deploy to the western yellow deployment point',
      ]);

      yield call(
        helperDeploy,
        'Cantina Patrol',
        'The sound of the door has alerted the patrol units inside.',
        ['The Cantina Patrol units will now be deployed.'],
        ...adaptedPatrol
      );

      yield put(createAction('SHADY_DEALINGS_SET_CANTINA_PATROL_DEPLOYED'));
      yield call(calculateDeploymentPoints);

      // TODO: Limit reinforcement and redeployment of patrol

      // We're done
      break;
    }
  }
}

function* handleJunkShopPatrol(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if ([3, 4].includes(id) && type === 'door' && value === true) {
      track('shadyDealings', 'junkShopPatrol', 'triggered');

      const {junkShopPatrol} = yield select(getState);
      const point = id === 3 ? 'top' : 'middle';
      const adaptedPatrol = junkShopPatrol.map((id: string) => [
        id,
        `Deploy to the ${point} blue deployment point`,
      ]);

      yield call(
        helperDeploy,
        'Junk Shop Patrol',
        'The sound of the door has alerted the patrol units inside.',
        ['The Junk Shop Patrol units will now be deployed.'],
        ...adaptedPatrol
      );

      yield put(createAction('SHADY_DEALINGS_SET_JUNK_SHOP_PATROL_DEPLOYED'));
      yield call(calculateDeploymentPoints);

      // TODO: Limit reinforcement and redeployment of patrol

      // We're done
      break;
    }
  }
}

function* handleReinforcements(): Generator<*, *, *> {
  while (true) {
    yield take(SET_MAP_STATE_ACTIVATED);
    const checkPass = yield call(
      helperCheckMapStateActivations,
      ['terminal-1', 'terminal-2', 'rebel-1', 'rebel-2'],
      2
    );

    if (checkPass) {
      track('shadyDealings', 'reinforcements', 'triggered');
      yield call(
        helperDeploy,
        'Reinforcements',
        'Unknown to you, the Raider group was there all along.',
        ['A Tusken Raider group will now be deployed.'],
        ['tuskenRaider', 'Deploy to the entrance.']
      );
      yield call(helperEventModal, {
        text: [
          'The threat has been increased by twice the threat level.',
          'An optional deployment will now be done.',
        ],
        title: 'Reinforcements',
      });
      // Double current threat
      yield call(helperIncreaseThreat, 2);

      // Need to change deployment point before doing optional deployment
      yield put(setDeploymentPoint(DEPLOYMENT_POINT_RED));

      // Do optional deployment
      yield put(optionalDeployment());
      yield take(OPTIONAL_DEPLOYMENT_DONE);

      // Change deployment point back
      yield call(calculateDeploymentPoints);

      // We're done
      break;
    }
  }
}

function* handleMoveTargetSwitch(): Generator<*, *, *> {
  while (true) {
    yield take(SET_MAP_STATE_ACTIVATED);
    const checkPass = yield call(
      helperCheckMapStateActivations,
      ['terminal-1', 'terminal-2', 'rebel-1', 'rebel-2'],
      3
    );

    if (checkPass) {
      yield put(setMoveTarget(TARGET_LAST_TOKEN));
      // We're done
      break;
    }
  }
}

function* handleMissionEnd(): Generator<*, *, *> {
  while (true) {
    yield take(SET_MAP_STATE_ACTIVATED);
    const checkPass = yield call(
      helperCheckMapStateActivations,
      ['terminal-1', 'terminal-2', 'rebel-1', 'rebel-2'],
      4
    );

    if (checkPass) {
      yield put(displayModal('REBEL_VICTORY'));
      track('shadyDealings', 'victory', 'objects');
      // We're done
      break;
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
      track('shadyDealings', 'defeat', 'round');
      break;
    }

    const {cantinaPatrolDeployed, junkShopPatrolDeployed} = yield select(getState);
    if (!cantinaPatrolDeployed && !junkShopPatrolDeployed) {
      yield put(setDeploymentPoint(getRandomDeploymentPoint()));
    }
    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(helperInitialSetup, ['heavyStormtrooper', 'imperialOfficer']);
  yield call(helperEventModal, {
    text: [
      'The heroes control {ELITE}R2-D2{END} as an ally at no additional cost.',
      'The threat has been increased by twice the threat level.',
      'An optional deployment will now be done.',
    ],
    title: 'Initial Setup',
  });

  yield call(setupPatrols);

  // Double current threat
  yield call(helperIncreaseThreat, 2);
  // Do optional deployment
  // Patrols already exclude open groups so we are ok here
  yield put(optionalDeployment());
  yield take(OPTIONAL_DEPLOYMENT_DONE);
  // Add R2-D2
  yield put(addToRoster('r2d2'));

  yield call(helperMissionBriefing, [
    'Doors are locked. A hero can interact ({STRENGTH} or {TECH}) to open a door. A Rebel figure can attack (Health: 5, Defense: None) to open a door.',
    'Mission tokens are informants. A hero can interact (2 {INSIGHT} or {STRENGTH}) to claim the token.',
    'A hero can interact with a terminal (2 {INSIGHT} or {TECH}) to claim the terminal.',
    `A hero cannot interact with a terminal or informant if there is a figure from a patrol within 4 spaces of that object.`,
  ]);

  yield put(missionSpecialSetupDone());
}

export function* shadyDealings(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_CLOSEST_REBEL));
  yield put(setMoveTarget(TARGET_TOKEN));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(getRandomDeploymentPoint()));

  yield all([
    fork(handleSpecialSetup),
    fork(handleCantinaPatrol),
    fork(handleJunkShopPatrol),
    fork(handleReinforcements),
    fork(handleMoveTargetSwitch),
    fork(handleMissionEnd),
    fork(handleHeroesWounded('shadyDealings', 'SHADY_DEALINGS_PRIORITY_TARGET_KILL_HERO', 'r2d2')),
    fork(handleStatusPhaseBegin),
    fork(handleRoundEnd),
  ]);

  track('missionStart', 'shadyDealings');
  yield put(missionSagaLoadDone());
}
