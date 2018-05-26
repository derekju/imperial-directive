// @flow

import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {getAreAllHeroesWithdrawn, getIsOneHeroLeft, WOUND_REBEL_HERO} from '../rebels';
import {
  getCurrentGroups,
  OPTIONAL_DEPLOYMENT_DONE,
  optionalDeployment,
  setCustomAI,
} from '../imperials';
import {
  getCurrentRound,
  getCurrentThreat,
  getMapStates,
  increaseThreat,
  MISSION_SPECIAL_SETUP,
  missionSpecialSetupDone,
  SET_MAP_STATE_ACTIVATED,
  setAttackTarget,
  setDeploymentPoint,
  setMapStateActivated,
  setMapStateVisible,
  setMoveTarget,
  STATUS_PHASE_END_ROUND_EFFECTS,
  statusPhaseEndRoundEffectsDone,
} from '../mission';
import createAction from '../createAction';
import {displayModal} from '../modal';
import handleStatusPhaseBegin from './sharedSagas/handleStatusPhaseBegin';
import helperDeploy from './helpers/helperDeploy';
import helperEventModal from './helpers/helperEventModal';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import type {ImperialUnitType} from '../imperials';
import {missionSagaLoadDone} from '../app';
import random from 'lodash/random';
import {REFER_CAMPAIGN_GUIDE} from './constants';
import type {StateType} from '../types';
import track from '../../lib/track';

// Constants

// Randomize which door is focused on
const randomDoorNumOutside = 2;
const randomDoorNumInside = random(3, 4);
const TARGET_DOOR_OUTSIDE = `door ${randomDoorNumOutside}`;
const TARGET_DOOR_INSIDE = `door ${randomDoorNumInside}`;
const TARGET_REMAINING_HERO = 'the remaining hero';
const TARGET_CLOSEST_HERO = 'the closest hero';
const TARGET_CAPTURE_POINT = 'the closest capture point';

const DEPLOYMENT_POINT_GREEN = 'The green deployment point';
const DEPLOYMENT_POINT_RED = 'The red deployment point';

const CUSTOM_AI = [
  {
    command:
      '{ACTION} Move until standing on closest capture point with free space, then {ACTION} Move until standing on closest capture point with free space.',
    condition: 'If not standing on a capture point',
  },
  {
    command:
      '{ACTION} Attack closest Hero within attack range (priority is any hero occupying the same capture point).',
    condition: 'If standing on a capture point',
  },
];

// Types

export type UnderSiegeStateType = {
  priorityTargetKillHero: boolean,
};

// State

const initialState = {
  priorityTargetKillHero: false,
};

export default (state: UnderSiegeStateType = initialState, action: Object) => {
  switch (action.type) {
    case 'UNDER_SIEGE_PRIORITY_TARGET_KILL_HERO':
      return {
        ...state,
        priorityTargetKillHero: action.payload,
      };
    default:
      return state;
  }
};

// Selectors

const getState = (state: StateType) => state.underSiege;
export const getUnderSiegeGoalText = (state: StateType): string[] => {
  const goals = [
    '{BOLD}Doors:{END}',
    `Health: 6, Defense: 1 black die`,
    '{BREAK}',
    'Imperial figures secure a Rebel mission token if no healthy Rebel figures are on any of the tiles under the mission token.',
    '{BREAK}',
    'Doors adjacent to a Rebel figure do not block movement or LOS.',
  ];

  return goals;
};

// Sagas

function* handleWave1(): Generator<*, *, *> {
  yield call(
    helperDeploy,
    'Wave 1',
    REFER_CAMPAIGN_GUIDE,
    [
      'The current threat has been increased by 5.',
      'A Royal Guard group will now be deployed.',
    ],
    ['royalGuard', 'Deploy to the green deployment point.']
  );
  yield put(increaseThreat(5));
}

function* handleAssault(): Generator<*, *, *> {
  // Either remove a door or increase threat by 3
  const mapStates = yield select(getMapStates);
  // If the outer door is still open, open it
  // Else if the inner door is still open, open it
  if (!mapStates[`door-${randomDoorNumOutside}`].activated) {
    yield call(helperEventModal, {
      story: 'A loud bang fills the air as the Imperial troops blow the outer door open.',
      text: [
        `Door ${randomDoorNumOutside} has been opened.`,
        'Roll 1 red die. Each hero within 3 spaces of the door suffers {DAMAGE} equal to the {DAMAGE} results.',
      ],
      title: 'Assault',
    });
    yield put(setMapStateActivated(randomDoorNumOutside, 'door', true));
  } else if (!mapStates[`door-${randomDoorNumInside}`].activated) {
    yield call(helperEventModal, {
      story: 'A loud bang fills the air as the Imperial troops blow the inner door open.',
      text: [
        `Door ${randomDoorNumInside} has been opened.`,
        'Roll 1 red die. Each hero within 3 spaces of the door suffers {DAMAGE} equal to the {DAMAGE} results.',
      ],
      title: 'Assault',
    });
    yield put(setMapStateActivated(randomDoorNumInside, 'door', true));
  } else {
    // Increase threat by 3
    yield call(helperEventModal, {
      story: 'Gunfire whistles through the air as the Imperial troops rally.',
      text: ['The current threat has been increased by 3.'],
      title: 'Assault',
    });
    yield put(increaseThreat(3));
  }
}

function* handleWave2(): Generator<*, *, *> {
  yield call(
    helperDeploy,
    'Wave 2',
    REFER_CAMPAIGN_GUIDE,
    [
      'The current threat has been increased by 3.',
      'An {ELITE}Elite Stormtrooper{END} group will now be deployed.',
    ],
    ['stormtrooperElite', 'Deploy to the green deployment point.']
  );
  yield put(increaseThreat(3));
}

function* handleSpecialists(): Generator<*, *, *> {
  // Deploy AT-ST or extra optional deployment that gets to go first
  // Our threat is 3 at this stage so worst deployment we could make is a probeDroid which isn't
  // terrible
  // If we can't do an optional deployment since no open groups or threat not enough to get anything
  // out, then do the AT-ST, otherwise, always do the optional deployment

  const {openGroups} = yield select(getCurrentGroups);
  const currentThreat = yield select(getCurrentThreat);
  const canDeployAnyGroup =
    openGroups.filter((group: ImperialUnitType) => group.threat <= currentThreat).length > 0;

  if (openGroups.length > 0 && canDeployAnyGroup) {
    yield call(helperEventModal, {
      story:
        "A nearby metal grate flies open as Imperial troops scramble out. The've found a way in!",
      text: ['An optional deployment will now be resolved to the red deployment point.'],
      title: 'Specialists',
    });

    // Need to temporarily set deployment point to red
    yield put(setDeploymentPoint(DEPLOYMENT_POINT_RED));
    // Do optional deployment
    yield put(optionalDeployment());
    yield take(OPTIONAL_DEPLOYMENT_DONE);
    // Set back
    yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN));
  } else {
    yield call(
      helperDeploy,
      'Specialists',
      'Tree branches snap outside as a giant AT-ST roars to life.',
      [
        'An {ELITE}AT-ST{END} will now be deployed.',
      ],
      ['atst', `Deploy to the yellow deployment point closest to door ${randomDoorNumOutside}.`]
    );
  }
}

function* handleWave3(): Generator<*, *, *> {
  yield call(
    helperDeploy,
    'Wave 3',
    REFER_CAMPAIGN_GUIDE,
    [
      'Deploy {ELITE}Darth Vader{END} to the green deployment point.',
      'The current threat has been increased by 3.',
    ],
    ['darthVader', 'Deploy to the green deployment point.']
  );
  yield put(increaseThreat(3));
}

function* handleDoorOpenOutside(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === randomDoorNumOutside && type === 'door' && value === true) {
      yield put(setCustomAI(CUSTOM_AI));

      // PRIORITY TARGET SWITCH
      const {priorityTargetKillHero} = yield select(getState);
      if (!priorityTargetKillHero) {
        yield put(setAttackTarget(TARGET_CLOSEST_HERO));
        yield put(setMoveTarget(TARGET_CAPTURE_POINT));
      }
      // We're done
      break;
    }
  }
}

function* handleInteriorPointsSecured(): Generator<*, *, *> {
  while (true) {
    yield take(SET_MAP_STATE_ACTIVATED);
    const mapStates = yield select(getMapStates);
    if (mapStates['rebel-1'].activated && mapStates['rebel-2'].activated) {
      // If interior door isn't down, then change target to it
      // Otherwise if it was blasted down already, change custom AI
      if (!mapStates[`door-${randomDoorNumInside}`].activated) {
        // PRIORITY TARGET SWITCH
        const {priorityTargetKillHero} = yield select(getState);
        if (!priorityTargetKillHero) {
          yield put(setAttackTarget(TARGET_DOOR_INSIDE));
          yield put(setMoveTarget(TARGET_DOOR_INSIDE));
          yield put(setCustomAI(null));
        }
      } else {
        yield put(setCustomAI(CUSTOM_AI));
      }
      // We're done
      break;
    }
  }
}

function* handleDoorOpenInside(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === randomDoorNumInside && type === 'door' && value === true) {
      yield put(setCustomAI(CUSTOM_AI));

      // PRIORITY TARGET SWITCH
      const {priorityTargetKillHero} = yield select(getState);
      if (!priorityTargetKillHero) {
        yield put(setAttackTarget(TARGET_CLOSEST_HERO));
        yield put(setMoveTarget(TARGET_CAPTURE_POINT));
      }
      // We're done
      break;
    }
  }
}

function* handleCapturedPoints(): Generator<*, *, *> {
  while (true) {
    yield take(SET_MAP_STATE_ACTIVATED);
    const mapStates = yield select(getMapStates);
    const results = [];
    if (mapStates['rebel-1'].activated) {
      yield put(setMapStateVisible(1, 'rebel', false));
      results.push('rebel-1');
    }
    if (mapStates['rebel-2'].activated) {
      yield put(setMapStateVisible(2, 'rebel', false));
      results.push('rebel-2');
    }
    if (mapStates['rebel-3'].activated) {
      yield put(setMapStateVisible(3, 'rebel', false));
      results.push('rebel-3');
    }
    if (mapStates['rebel-4'].activated) {
      yield put(setMapStateVisible(4, 'rebel', false));
      results.push('rebel-4');
    }
    if (mapStates['rebel-5'].activated) {
      yield put(setMapStateVisible(5, 'rebel', false));
      results.push('rebel-5');
    }

    if (results.length === 4) {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      track('underSiege', 'defeat', 'secured');
      break;
    }
  }
}

function* handleHeroesWithdrawn(): Generator<*, *, *> {
  while (true) {
    yield take(WOUND_REBEL_HERO);
    const allWithdrawn = yield select(getAreAllHeroesWithdrawn);
    if (allWithdrawn) {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      track('underSiege', 'defeat', 'wounded');
      break;
    }
    const isOneHeroLeft = yield select(getIsOneHeroLeft);
    if (isOneHeroLeft) {
      // PRIORITY TARGET SWITCH
      yield put(createAction('UNDER_SIEGE_PRIORITY_TARGET_KILL_HERO', true));
      yield put(setAttackTarget(TARGET_REMAINING_HERO));
      yield put(setMoveTarget(TARGET_REMAINING_HERO));
    }
  }
}

// REQUIRED SAGA
function* handleRoundEnd(): Generator<*, *, *> {
  while (true) {
    yield take(STATUS_PHASE_END_ROUND_EFFECTS);
    const currentRound = yield select(getCurrentRound);

    if (currentRound === 2) {
      yield call(handleWave1);
    } else if (currentRound === 3) {
      yield call(handleAssault);
    } else if (currentRound === 4) {
      yield call(handleWave2);
    } else if (currentRound === 5) {
      yield call(handleSpecialists);
    } else if (currentRound === 6) {
      yield call(handleWave3);
    } else if (currentRound === 8) {
      // End game with rebel victory
      yield put(displayModal('REBEL_VICTORY'));
      track('underSiege', 'victory', 'rounds');
      break;
    }

    yield call(helperEventModal, {
      text: [
        'If an Imperial figure occupies a tile with a mission token and there are no healthy Rebel figures on that site, it is captured. Manually activate that token to secure it.',
      ],
      title: 'Securing a Capture Point',
    });

    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(helperInitialSetup, ['eWebEngineer', 'imperialOfficer', 'stormtrooper']);
  yield call(helperMissionBriefing, [
    'Rebel mission tokens represent capture sites. At the end of each round, if an Imperial figure occupies a tile with a mission token and there are no healthy Rebel figures on that site, it is captured. Manually activate that token to secure it.',
    'Doors are locked. An Imperial figure can attack a Door to destroy it (Health: 6, Defense: 1 black die).',
    'Doors adjacent to a Rebel figure do not block movement or LOS.',
    'Rebel figures deploy their figures to any interior space.',
    'Rebels win at the end of Round 8.',
  ]);
  yield put(missionSpecialSetupDone());
}

/*
Priority target definitions:
1) Initial attack is the nearest closed door, move is the nearest closed door
2) Once door opens, attack is closest hero, move is the nearest capture point
3) If first interior capture points are taken, switch back to nearest closed door for both
4) Switch back to closest hero and capture point once the interior doors are gone
4) At any point if 1 hero left, attack and move are the last remaining hero
*/
export function* underSiege(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_DOOR_OUTSIDE));
  yield put(setMoveTarget(TARGET_DOOR_OUTSIDE));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN));

  yield all([
    fork(handleSpecialSetup),
    fork(handleDoorOpenOutside),
    fork(handleInteriorPointsSecured),
    fork(handleDoorOpenInside),
    fork(handleHeroesWithdrawn),
    fork(handleCapturedPoints),
    fork(handleStatusPhaseBegin),
    fork(handleRoundEnd),
  ]);

  track('missionStart', 'underSiege');
  yield put(missionSagaLoadDone());
}
