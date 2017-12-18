// @flow

import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {getAreAllHeroesWounded, getIsOneHeroLeft, WOUND_REBEL_HERO} from '../rebels';
import {
  getCurrentRound,
  MISSION_SPECIAL_SETUP,
  missionSpecialSetupDone,
  SET_MAP_STATE_ACTIVATED,
  setAttackTarget,
  setDeploymentPoint,
  setMoveTarget,
  statusPhaseEndRoundEffectsDone,
  STATUS_PHASE_END_ROUND_EFFECTS,
} from '../mission';
import {OPTIONAL_DEPLOYMENT_DONE, optionalDeployment} from '../imperials';
import {REFER_CAMPAIGN_GUIDE, TARGET_REMAINING} from './constants';
import createAction from '../createAction';
import {displayModal} from '../modal';
import helperDeploy from './helpers/helperDeploy';
import helperEventModal from './helpers/helperEventModal';
import helperIncreaseThreat from './helpers/helperIncreaseThreat';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import {getMissionThreat, missionSagaLoadDone} from '../app';
import type {StateType} from '../types';
import track from '../../lib/track';

// Constants

const TARGET_DOOR = 'the first door';
const TARGET_DOOR_3 = 'the third door';
const TARGET_HERO_CLOSE_DOOR_3 = 'the unwounded hero closest to door 3';

const DEPLOYMENT_POINT_GREEN = 'The green deployment point';
const DEPLOYMENT_POINT_RED = 'The right red deployment point';

// Types

export type MeansOfProductionStateType = {
  priorityTargetKillHero: boolean,
  tokensLeft: {
    [color: string]: number,
  },
};

// State

const initialState = {
  door3Open: false,
  priorityTargetKillHero: false,
  tokensLeft: {
    blue: 2,
    green: 2,
    red: 2,
    yellow: 2,
  },
};

export default (state: MeansOfProductionStateType = initialState, action: Object) => {
  switch (action.type) {
    case 'MEANS_PRODUCTION_OPEN_DOOR_3':
      return {
        ...state,
        door3Open: true,
      };
    case 'MEANS_PRODUCTION_DECREMENT_TOKEN':
      const color = action.payload;
      return {
        ...state,
        tokensLeft: {
          ...state.tokensLeft,
          [color]: state.tokensLeft[color] - 1,
        },
      };
    case 'MEANS_PRODUCTION_PRIORITY_TARGET_KILL_HERO':
      return {
        ...state,
        priorityTargetKillHero: action.payload,
      };
    default:
      return state;
  }
};

// Selectors

const getState = (state: StateType) => state.meansOfProduction;
export const getMeansOfProductionGoalText = (state: StateType): string[] => {
  const missionThreat = state.app.missionThreat;
  const {tokensLeft} = state.meansOfProduction;

  let doorHealth = missionThreat * 2;
  let goals = ['{BOLD}Doors:{END}', `Health: ${doorHealth}, Defense: 1 {BLOCK}`];

  if (tokensLeft.blue < 2) {
    doorHealth = tokensLeft.blue === 1 ? missionThreat * 4 : missionThreat * 6;
    goals = goals.concat([
      '{BREAK}',
      '{BOLD}Door #3:{END}',
      `Health: ${doorHealth}, Defense: 1 {BLOCK}`,
    ]);
  }

  if (tokensLeft.green < 2) {
    const damageTaken = tokensLeft.green === 1 ? 2 : 4;
    goals = goals.concat([
      `When Door #3 is attacked: The attacker suffers ${damageTaken} {DAMAGE}`,
    ]);
  }

  goals = goals.concat([
    '{BREAK}',
    '{BOLD}Data Core:{END}',
    'A Rebel figure can interact with to destroy',
  ]);

  return goals;
};

// Sagas

function* handleGuardedEvent(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'door' && value === true) {
      track('meansOfProduction', 'guarded', 'triggered');
      yield call(
        helperDeploy,
        REFER_CAMPAIGN_GUIDE,
        ['Deploy an E-Web Engineer to the Yellow deployment point.'],
        'Guarded',
        ['eWebEngineer']
      );
      // SWITCH TARGET
      const {priorityTargetKillHero} = yield select(getState);
      if (!priorityTargetKillHero) {
        yield put(setMoveTarget(TARGET_DOOR_3));
      }
      yield put(setDeploymentPoint(DEPLOYMENT_POINT_RED));
      yield call(handleReactiveDefenses, true);
      break;
    }
  }
}

function* handleDoor3Open(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 3 && type === 'door' && value === true) {
      yield put(createAction('MEANS_PRODUCTION_OPEN_DOOR_3', true));
      break;
    }
  }
}

function* handleReactiveDefenses(dueToDoorOneOpening: boolean): Generator<*, *, *> {
  // Blue - health of twice the threat to the chosen door
  // Red - when door opens, increase threat by the threat level
  // Green - attacker suffers 2 damage for attacking the door
  // Yellow - each hero within 5 spaces tests strength. if fail, stun

  // Strategy is load blue tokens on door 3
  // Then load green tokens on door 3
  // Red fires immediately on door opening
  // If door 3 opens, then use up yellow tokens
  const missionThreat = yield select(getMissionThreat);
  const {door3Open, tokensLeft} = yield select(getState);

  // If we triggered this due to the door opening and we still have red tokens, immediately
  // use one for the door we just opened
  if (dueToDoorOneOpening && tokensLeft.red === 2) {
    yield call(helperEventModal, {
      text: [
        'A red neutral token was used for door 1.',
        `The threat has been raised by ${missionThreat}`,
      ],
      title: 'Reactive Defenses',
    });
    yield put(createAction('MEANS_PRODUCTION_DECREMENT_TOKEN', 'red'));
    yield call(helperIncreaseThreat, 1);
  } else if (!door3Open && tokensLeft.blue) {
    const doorHealth = tokensLeft.blue === 2 ? missionThreat * 4 : missionThreat * 6;
    yield call(helperEventModal, {
      text: [
        'Place a blue neutral token outside of door 3.',
        `That door now has ${doorHealth} Health.`,
      ],
      title: 'Reactive Defenses',
    });
    yield put(createAction('MEANS_PRODUCTION_DECREMENT_TOKEN', 'blue'));
  } else if (!door3Open && tokensLeft.green) {
    yield call(helperEventModal, {
      text: [
        'Place a green neutral token outside of door 3.',
        'If a hero attacks the door, they take 2 {DAMAGE} for each green token placed by the door.',
      ],
      title: 'Reactive Defenses',
    });
    yield put(createAction('MEANS_PRODUCTION_DECREMENT_TOKEN', 'green'));
  } else if (door3Open && tokensLeft.yellow) {
    yield call(helperEventModal, {
      text: [
        'A yellow neutral token was used for door 3.',
        'Each hero within 5 spaces tests {STRENGTH}. Each hero who fails is stunned.',
      ],
      title: 'Reactive Defenses',
    });
    yield put(createAction('MEANS_PRODUCTION_DECREMENT_TOKEN', 'yellow'));
  } else if (tokensLeft.red) {
    yield call(helperEventModal, {
      text: ['A red neutral token was used.', `The threat has been raised by ${missionThreat}`],
      title: 'Reactive Defenses',
    });
    yield put(createAction('MEANS_PRODUCTION_DECREMENT_TOKEN', 'red'));
    yield call(helperIncreaseThreat, 1);
  }
}

function* handleDataCoreDestroyed(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'imperial' && value === true) {
      // End game with rebel victory
      yield put(displayModal('REBEL_VICTORY'));
      track('meansOfProduction', 'victory', 'core');
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
      track('meansOfProduction', 'defeat', 'wounded');
      break;
    }
    const isOneHeroLeft = yield select(getIsOneHeroLeft);
    if (isOneHeroLeft) {
      // PRIORITY TARGET SWITCH
      yield put(createAction('MEANS_PRODUCTION_PRIORITY_TARGET_KILL_HERO', true));
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
      track('meansOfProduction', 'defeat', 'round');
      break;
    }

    yield call(handleReactiveDefenses);
    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(helperInitialSetup, 'Probe Droid, Stormtrooper');
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
    `Doors are locked. A Rebel figure can attack a door to open it (Health: ${missionThreat *
      2}, Defense: 1 {BLOCK}).`,
    'The Imperial mission token is the data core. A Rebel figure can interact with it to destroy it.',
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
export function* meansOfProduction(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_HERO_CLOSE_DOOR_3));
  yield put(setMoveTarget(TARGET_DOOR));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN));

  yield all([
    fork(handleSpecialSetup),
    fork(handleGuardedEvent),
    fork(handleDoor3Open),
    fork(handleDataCoreDestroyed),
    fork(handleHeroesWounded),
    fork(handleRoundEnd),
  ]);

  track('missionStart', 'meansOfProduction');
  yield put(missionSagaLoadDone());
}
