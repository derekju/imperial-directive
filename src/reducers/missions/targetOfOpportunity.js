// @flow

import {
  addToRoster,
  getAreAllHeroesWounded,
  getIsOneHeroLeft,
  setCanIncapacitate,
  WOUND_REBEL_HERO,
} from '../rebels';
import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {
  getCurrentRound,
  getCurrentThreat,
  increaseThreat,
  MISSION_SPECIAL_SETUP,
  missionSpecialSetupDone,
  SET_MAP_STATE_ACTIVATED,
  setAttackTarget,
  setDeploymentPoint,
  setMapStateActivated,
  setMoveTarget,
  STATUS_PHASE_END_ROUND_EFFECTS,
  statusPhaseEndRoundEffectsDone,
} from '../mission';
import {OPTIONAL_DEPLOYMENT_DONE, optionalDeployment} from '../imperials';
import createAction from '../createAction';
import {displayModal} from '../modal';
import handleStatusPhaseBegin from './sharedSagas/handleStatusPhaseBegin';
import helperDeploy from './helpers/helperDeploy';
import helperEventModal from './helpers/helperEventModal';
import helperIncreaseThreat from './helpers/helperIncreaseThreat';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import {missionSagaLoadDone} from '../app';
import {REFER_CAMPAIGN_GUIDE, TARGET_HERO_CLOSEST_UNWOUNDED, TARGET_REMAINING} from './constants';
import type {StateType} from '../types';
import track from '../../lib/track';

// Constants

const TARGET_ARCHIVE_DOOR = 'the Archive door';
const TARGET_CORE = 'the data core';
const DEPLOYMENT_POINT_GREEN_E = 'The eastern green deployment point';

// Types

export type TargetOfOpportunityStateType = {
  priorityTargetKillHero: boolean,
  saboteursFreed: boolean,
};

// State

const initialState = {
  priorityTargetKillHero: false,
  saboteursFreed: false,
};

export default (state: TargetOfOpportunityStateType = initialState, action: Object) => {
  switch (action.type) {
    case 'TARGET_OF_OPPORTUNITY_PRIORITY_TARGET_KILL_HERO':
      return {
        ...state,
        priorityTargetKillHero: true,
      };
    case 'TARGET_OF_OPPORTUNITY_SABOTEURS_FREED':
      return {
        ...state,
        saboteursFreed: true,
      };
    default:
      return state;
  }
};

// Selectors

export const getTargetOfOpportunityGoalText = (state: StateType): string[] => {
  let goals = [];

  if (!state.targetOfOpportunity.saboteursFreed) {
    goals = goals.concat([
      '{BOLD}Cell Door:{END}',
      'Locked. A hero can interact with the terminal (2 {TECH}) to open.',
      '{BREAK}',
    ]);
  }

  goals = goals.concat([
    '{BOLD}Archives Door:{END}',
    'Locked. A Rebel figure can attack to open. The door has Health: 8, Defense: 5 {BLOCK}.',
    '{BREAK}',
    '{BOLD}Data Core:{END}',
    'Health: 6, Defense: None',
    '{BREAK}',
    '{BOLD}Rebel Saboteurs:{END}',
  ]);

  if (state.targetOfOpportunity.saboteursFreed) {
    goals = goals.concat([
      'Rebel Saboteurs when defeated are incapacitated instead. They gain 1 action per activation only.',
      '{BREAK}',
      'A non-incapacitated Rebel Saboteur gains +1 {SURGE} when attacking.',
    ]);
  } else {
    goals = goals.concat(['Heroes gain control after the Cell door opens.']);
  }

  return goals;
};

// Sagas

function* handleFinishJobEvent(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'terminal' && value === true) {
      track('targetOfOpportunity', 'finishTheJob', 'triggered');

      yield put(setMapStateActivated(1, 'door', true));

      yield call(helperEventModal, {
        story: REFER_CAMPAIGN_GUIDE,
        text: [
          'The heroes now control the Rebel Saboteurs.',
          'When a Rebel Saboteur is defeated, he is incapacitated instead. When activating, he receives only 1 action.',
          'While a non-incapacitated Rebel Saboteur is attacking the door, apply +1 {SURGE} to the results.',
        ],
        title: 'Finish the Job',
      });

      yield put(createAction('TARGET_OF_OPPORTUNITY_SABOTEURS_FREED', true));
      yield put(addToRoster('rebelSaboteur'));
      yield put(setCanIncapacitate(['rebelSaboteur']));
      break;
    }
  }
}

function* handleArchiveDoorOpens(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 2 && type === 'door' && value === true) {
      track('targetOfOpportunity', 'dataCore', 'triggered');

      yield call(
        helperDeploy,
        'As you step through the remains of the door, you spot the Royal Guards waiting in the shadows.',
        ['Deploy a Royal Guard group to the red point.'],
        'Data Core',
        ['royalGuard']
      );

      const currentThreat = yield select(getCurrentThreat);
      if (currentThreat >= 2) {
        yield call(helperEventModal, {
          text: [
            'The Royal Guards interrupt to perform 1 move and 1 attack. Target the closest Rebel figure.',
            'The threat has been reduced by 2.',
          ],
          title: 'Data Core',
        });

        yield put(increaseThreat(-2));
      }

      yield put(setMoveTarget(TARGET_CORE));

      break;
    }
  }
}

function* handleDataCoreDestroyed(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'neutral' && value === true) {
      yield put(displayModal('REBEL_VICTORY'));
      track('targetOfOpportunity', 'victory', 'dataCore');
      // We're done
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
      track('targetOfOpportunity', 'defeat', 'wounded');
      break;
    }
    const isOneHeroLeft = yield select(getIsOneHeroLeft);
    if (isOneHeroLeft) {
      // Switch targets
      yield put(createAction('TARGET_OF_OPPORTUNITY_PRIORITY_TARGET_KILL_HERO', true));
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

    if (currentRound === 6) {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      track('targetOfOpportunity', 'defeat', 'rounds');
      break;
    }

    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(helperInitialSetup, 'Imperial Officer, Probe Droid, Stormtrooper');
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
    'Doors are locked. A Hero can interact with the terminal (2 {TECH}) to open the door to the Cell.',
    'A Rebel figure can attack the door to the Archives to open it (Health: 8, Defense: 5 {BLOCK}).',
    'The heroes do not control the Rebel Saboteurs until the door to the Cell opens.',
    'The neutral mission token is the data core. A Rebel figure can attack the core to destroy it (Health: 6, Defense: None).',
  ]);
  yield put(missionSpecialSetupDone());
}

/*
Priority target definitions:
1) Initial is closest unwounded, move is closest spice
2) Once door opens, move is closest spice barrel
*/

export function* targetOfOpportunity(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
  yield put(setMoveTarget(TARGET_ARCHIVE_DOOR));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN_E));

  yield all([
    fork(handleSpecialSetup),
    fork(handleFinishJobEvent),
    fork(handleArchiveDoorOpens),
    fork(handleDataCoreDestroyed),
    fork(handleHeroesWounded),
    fork(handleStatusPhaseBegin),
    fork(handleRoundEnd),
  ]);

  track('missionStart', 'targetOfOpportunity');
  yield put(missionSagaLoadDone());
}
