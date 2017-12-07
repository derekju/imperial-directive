// @flow

import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {DEFEAT_IMPERIAL_FIGURE, OPTIONAL_DEPLOYMENT_DONE, optionalDeployment} from '../imperials';
import {getAreAllHeroesWounded, getIsOneHeroLeft, WOUND_REBEL_HERO} from '../rebels';
import {
  getCurrentRound,
  getMapStates,
  MISSION_SPECIAL_SETUP,
  missionSpecialSetupDone,
  SET_MAP_STATE_ACTIVATED,
  setAttackTarget,
  setDeploymentPoint,
  setMapStateVisible,
  setMoveTarget,
  statusPhaseEndRoundEffectsDone,
  STATUS_PHASE_END_ROUND_EFFECTS,
} from '../mission';
import {REFER_CAMPAIGN_GUIDE, TARGET_HERO_CLOSEST_UNWOUNDED, TARGET_REMAINING} from './constants';
import createAction from '../createAction';
import {displayModal} from '../modal';
import helperChoiceModal from './helpers/helperChoiceModal';
import helperDeploy from './helpers/helperDeploy';
import helperEventModal from './helpers/helperEventModal';
import helperIncreaseThreat from './helpers/helperIncreaseThreat';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import {missionSagaLoadDone} from '../app';
import type {StateType} from '../types';
import track from '../../lib/track';

// Constants

const TARGET_EXPLOSIVE = 'the closest active explosive';

const DEPLOYMENT_POINT_GREEN_S = 'The southern green deployment point';
const DEPLOYMENT_POINT_GREEN_N = 'The northern green deployment point';
const DEPLOYMENT_POINT_GREEN_E = 'The eastern green deployment point';

// Types

export type BrushfireStateType = {
  atstDead: boolean,
  explosiveAdded: boolean,
  priorityTargetKillHero: boolean,
};

// State

const initialState = {
  atstDead: false,
  explosiveAdded: false,
  priorityTargetKillHero: false,
};

export default (state: BrushfireStateType = initialState, action: Object) => {
  switch (action.type) {
    case 'BRUSHFIRE_EXPLOSIVE_ADDED':
      return {
        ...state,
        explosiveAdded: true,
      };
    case 'BRUSHFIRE_ATST_DEAD':
      return {
        ...state,
        atstDead: true,
      };
    case 'BRUSHFIRE_PRIORITY_TARGET_KILL_HERO':
      return {
        ...state,
        priorityTargetKillHero: action.payload,
      };
    default:
      return state;
  }
};

// Selectors

const getState = (state: StateType) => state.brushfire;
export const getBrushfireGoalText = (state: StateType): string[] => {
  const goals = [
    '{BOLD}Explosives:{END}',
    'A hero can interact ({TECH}) with one to disarm and discard it.',
    '{BREAK}',
    'If the hero is Fenn or is within 3 spaces of Fenn, the figure disarms and retrieves it.',
    '{BREAK}',
    'A hero carrying the explosive can interact with the {ELITE}AT-ST{END} to place 1 explosive on it.',
    '{BREAK}',
    'If an explosive is dropped, it is still disarmed. Another hero can pick it up.',
    '{BREAK}',
    'At the end of each round, discard all explosives on the {ELITE}AT-ST{END} to deal 5 {DAMAGE} for each token.',
  ];

  return goals;
};

// Sagas

function* handleSmallVictoryEvent(): Generator<*, *, *> {
  while (true) {
    const action = yield take(DEFEAT_IMPERIAL_FIGURE);
    const {group} = action.payload;
    if (group.id === 'atst') {
      yield call(
        helperDeploy,
        REFER_CAMPAIGN_GUIDE,
        [
          'Roll 2 red dice. Each figure within 2 spaces of the defeated {ELITE}AT-ST{END} suffers {DAMAGE} equal to the {DAMAGE} results.',
          'Deploy a Trandoshan Hunter to the northern green deployment point.',
        ],
        'Small Victory',
        ['trandoshanHunter']
      );
      yield put(createAction('BRUSHFIRE_ATST_DEAD', true));
      break;
    }
  }
}

function* handleExplosiveDisarmed(): Generator<*, *, *> {
  while (true) {
    yield take(SET_MAP_STATE_ACTIVATED);
    const mapStates = yield select(getMapStates);
    const results = [];
    if (mapStates['imperial-1'].activated) {
      yield put(setMapStateVisible(1, 'imperial', false));
      yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN_N));
      results.push('imperial-1');
    }
    if (mapStates['imperial-2'].activated) {
      yield put(setMapStateVisible(2, 'imperial', false));
      yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN_E));
      results.push('imperial-2');
    }
    if (mapStates['imperial-3'].activated) {
      yield put(setMapStateVisible(3, 'imperial', false));
      yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN_N));
      results.push('imperial-3');
    }
    if (mapStates['imperial-4'].activated) {
      yield put(setMapStateVisible(4, 'imperial', false));
      yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN_N));
      results.push('imperial-4');
    }
    if (mapStates['imperial-5'].activated) {
      yield put(setMapStateVisible(5, 'imperial', false));
      yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN_E));
      results.push('imperial-5');
    }
    if (mapStates['imperial-6'].activated) {
      yield put(setMapStateVisible(6, 'imperial', false));
      yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN_N));
      results.push('imperial-6');
    }
    if (mapStates['imperial-7'].activated) {
      yield put(setMapStateVisible(7, 'imperial', false));
      yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN_E));
      results.push('imperial-7');
    }

    if (results.length === 3) {
      // SWITCH TARGET
      const {priorityTargetKillHero} = yield select(getState);
      if (!priorityTargetKillHero) {
        yield put(setMoveTarget(TARGET_EXPLOSIVE));
      }
    } else if (results.length === 4) {
      // Handle Last Stand Event
      yield call(handleLastStandEvent);
    } else {
      // Did we win?
      const {explosiveAdded} = yield select(getState);
      const totalNeededToWin = explosiveAdded ? 7 : 6;
      if (results.length === totalNeededToWin) {
        yield put(displayModal('REBEL_VICTORY'));
        track('brushfire', 'victory', 'explosives');
        // We're done
        break;
      }
    }
  }
}

function* handleLastStandEvent(): Generator<*, *, *> {
  yield call(helperEventModal, {
    story: 'Explosions rain all around as the Imperial troops fall back',
    text: ['The threat has been increased.', 'An optional deployment will now be done.'],
    title: 'Last Stand',
  });

  // Increase threat
  yield call(helperIncreaseThreat, 1);
  // Optional deployment
  yield put(optionalDeployment());
  yield take(OPTIONAL_DEPLOYMENT_DONE);
  // Is hero carrying explosive?
  const answer = yield call(helperChoiceModal, 'Is a Hero carrying an explosive?', 'Last Stand');
  if (answer === 'yes') {
    yield call(helperEventModal, {
      story: 'With a bang an Imperial Officer triggers a remote detonation!',
      text: [
        'Discard an explosive from a hero carrying an explosive. That hero suffers 4 {DAMAGE}.',
        'If more than one hero is carrying an explosive, choose the least Healthy hero.',
      ],
      title: 'Last Stand',
    });
  } else {
    yield call(helperEventModal, {
      story: 'A Imperial ship appears from the sky and drops a new explosive onto the field.',
      text: ['A new explosive (I7) has been added to the map.'],
      title: 'Last Stand',
    });
    // TODO: Randomize this location at the start of the mission?
    yield put(setMapStateVisible(7, 'imperial', true));
    yield put(createAction('BRUSHFIRE_EXPLOSIVE_ADDED', true));
  }
}

function* handleHeroesWounded(): Generator<*, *, *> {
  while (true) {
    yield take(WOUND_REBEL_HERO);
    const allWounded = yield select(getAreAllHeroesWounded);
    if (allWounded) {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      track('brushfire', 'defeat', 'wounded');
      break;
    }
    const isOneHeroLeft = yield select(getIsOneHeroLeft);
    if (isOneHeroLeft) {
      // PRIORITY TARGET SWITCH #4
      yield put(createAction('BRUSHFIRE_PRIORITY_TARGET_KILL_HERO', true));
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

    if (currentRound === 5) {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      track('brushfire', 'defeat', 'rounds');
      break;
    }

    const {atstDead} = yield select(getState);
    if (!atstDead) {
      yield call(helperEventModal, {
        text: [
          'If there are any explosives on the {ELITE}AT-ST{END}, discard them to do 5 {DAMAGE} to the {ELITE}AT-ST{END} for each token discarded.',
        ],
        title: 'Boom',
      });
    }

    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(
    helperInitialSetup,
    '{ELITE}AT-ST{END}, E-Web Engineer, Imperial Officer, Probe Droid'
  );
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
    'Mission tokens are explosives. A hero can interact ({TECH}) with one to disarm and discard it.',
    'If the hero is Fenn or is within 3 spaces of Fenn, the figure disarms and retrieves it.',
    'If dropped, a hero can pick it up still.',
    'A hero carrying the explosive can interact with the {ELITE}AT-ST{END} to place 1 explosive on it.',
    'At the end of each round, discard all explosives on the {ELITE}AT-ST{END} to deal 5 {DAMAGE} for each token.',
  ]);
  yield put(missionSpecialSetupDone());
}

/*
Priority target definitions:
1) Initial attack is hero, move is hero
2) If three explosives disarmed, move is closest explosive
3) Deployment depends on which explosive was just disarmed
4) At any point if heroes - 1 are wounded, attack and move are the last remaining hero
*/
export function* brushfire(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
  yield put(setMoveTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN_S));

  yield all([
    fork(handleSpecialSetup),
    fork(handleSmallVictoryEvent),
    fork(handleExplosiveDisarmed),
    fork(handleHeroesWounded),
    fork(handleRoundEnd),
  ]);

  track('missionStart', 'brushfire');
  yield put(missionSagaLoadDone());
}
