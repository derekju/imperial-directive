// @flow

import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {
  disableThreatIncrease,
  getCurrentRound,
  MISSION_SPECIAL_SETUP,
  missionSpecialSetupDone,
  setAttackTarget,
  setDeploymentPoint,
  setMoveTarget,
  STATUS_PHASE_END_ROUND_EFFECTS,
  statusPhaseEndRoundEffectsDone,
} from '../mission';
import {getAreAllHeroesWounded, getIsOneHeroLeft, WOUND_REBEL_HERO} from '../rebels';
import {
  DEFEAT_IMPERIAL_FIGURE,
  getCurrentGroups,
  OPTIONAL_DEPLOYMENT_DONE,
  optionalDeployment,
} from '../imperials';
import {REFER_CAMPAIGN_GUIDE, TARGET_HERO_CLOSEST_UNWOUNDED, TARGET_REMAINING} from './constants';
import createAction from '../createAction';
import {displayModal} from '../modal';
import {getMissionThreat} from '../app';
import handleStatusPhaseBegin from './sharedSagas/handleStatusPhaseBegin';
import helperDeploy from './helpers/helperDeploy';
import helperEventModal from './helpers/helperEventModal';
import helperIncreaseThreat from './helpers/helperIncreaseThreat';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import {missionSagaLoadDone} from '../app';
import random from 'lodash/random';
import type {StateType} from '../types';
import track from '../../lib/track';

// Constants

const TARGET_ATST = 'the AT-ST';

const DEPLOYMENT_POINT_GREEN_N = 'The northern green deployment point';
const DEPLOYMENT_POINT_GREEN_E = 'The eastern green deployment point';
const DEPLOYMENT_POINT_GREEN_S = 'The southern green deployment point';

// Types

export type LooseCannonStateType = {
  priorityTargetKillHero: boolean,
};

// State

const initialState = {
  priorityTargetKillHero: false,
};

export default (state: LooseCannonStateType = initialState, action: Object) => {
  switch (action.type) {
    case 'LOOSE_CANNON_PRIORITY_TARGET_KILL_HERO':
      return {
        ...state,
        priorityTargetKillHero: action.payload,
      };
    default:
      return state;
  }
};

// Selectors

export const getLooseCannonGoalText = (state: StateType): string[] => {
  const goals = [
    '{BOLD}AT-ST:{END}',
    "Under Mak's control. Activate the AT-ST in place of Mak.",
    'It gains health equal to the threat level. It is allowed to enter and occupy spaces in the Hanger.',
    '{BREAK}',
    '{BOLD}Hanger and Testing Grounds:{END}',
    'The intermediate wall does not block movement or LOS.',
    '{BREAK}',
    "{BOLD}Mak's AT-ST:{END}",
  ];

  return goals;
};

// Sagas

function* handleAtstDefeated(): Generator<*, *, *> {
  yield take('LOOSE_CANNON_DEFEAT_ATST');
  track('looseCannon', 'pressAdvantage', 'triggered');
  const missionThreat = yield select(getMissionThreat);
  yield call(helperEventModal, {
    story: REFER_CAMPAIGN_GUIDE,
    text: [
      "Place Mak's figure in one of the spaces where the AT-ST was. He suffers 10 {DAMAGE}.",
      'Execute the first command in this list that is applicable:',
      'If the {ELITE}Royal Guard Champion{END} is within 7 spaces of an unwounded hero (priority most damaged), move adjacent to that hero and attack them.',
      `If the {ELITE}Royal Guard Champion{END} has taken damage, recover up to ${missionThreat +
        1} {DAMAGE}.`,
      'All Imperial figures move up to 2 towards the nearest Rebel figure.',
    ],
    title: 'Press the Advantage',
  });
  yield put(setAttackTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
  yield put(setMoveTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
}

function* handleAllImperialsDefeated(): Generator<*, *, *> {
  while (true) {
    yield take(DEFEAT_IMPERIAL_FIGURE);
    const {deployedGroups} = yield select(getCurrentGroups);

    if (deployedGroups.length === 0) {
      // End game with imperial victory
      yield put(displayModal('REBEL_VICTORY'));
      track('looseCannon', 'victory', 'killedAll');
      break;
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
      track('looseCannon', 'defeat', 'wounded');
      break;
    }
    const isOneHeroLeft = yield select(getIsOneHeroLeft);
    if (isOneHeroLeft) {
      // SWITCH TARGET
      yield put(createAction('LOOSE_CANNON_PRIORITY_TARGET_KILL_HERO', true));
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

    if (currentRound === 1) {
      // Chaos event
      track('looseCannon', 'chaos', 'triggered');
      yield call(
        helperDeploy,
        'Chaos',
        'Reinforcements arrive amidst the chaos.',
        ['An E-Web Engineer will now be deployed.'],
        ['eWebEngineer', 'Deploy to the southern green deployment point.']
      );
    } else if (currentRound === 3) {
      yield call(helperEventModal, {
        text: ['For the rest of the mission, threat cannot increase.'],
        title: 'Strategic Withdrawal',
      });
      yield put(disableThreatIncrease());
    } else if (currentRound === 7) {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      track('looseCannon', 'defeat', 'round');
      break;
    }

    // Randomize deployment point
    const deploymentPoints = [
      DEPLOYMENT_POINT_GREEN_E,
      DEPLOYMENT_POINT_GREEN_N,
      DEPLOYMENT_POINT_GREEN_S,
    ];
    const randomIndex = random(0, 2);
    yield put(setDeploymentPoint(deploymentPoints[randomIndex]));

    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(helperInitialSetup, [
    'royalGuardChampion',
    'imperialOfficerElite',
    'royalGuard',
    'stormtrooperElite',
  ]);
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
    "Deploy an {ELITE}AT-ST{END} to the indicated spot on the map and do not deploy Mak's figure.",
    "The {ELITE}AT-ST{END} is a Rebel figure under Mak's control. When Mak activates, ready and activate the {ELITE}AT-ST{END}.",
    'The {ELITE}AT-ST{END} gains additional health equal to the threat level. It is allowed to enter and occupy spaces in the Hanger.',
    'The wall between the Hanger (tile 19A) and Testing Grounds (tile 2B) does not block movement or LOS.',
  ]);
  yield put(missionSpecialSetupDone());
}

/*
Priority target definitions:
1) Initial attack and move is AT-ST
2) If AT-ST defeated, then go to closest unwounded
3) If one hero left target that hero
*/
export function* looseCannon(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_ATST));
  yield put(setMoveTarget(TARGET_ATST));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN_S));

  yield all([
    fork(handleSpecialSetup),
    fork(handleAllImperialsDefeated),
    fork(handleAtstDefeated),
    fork(handleHeroesWounded),
    fork(handleStatusPhaseBegin),
    fork(handleRoundEnd),
  ]);

  track('missionStart', 'looseCannon');
  yield put(missionSagaLoadDone());
}
