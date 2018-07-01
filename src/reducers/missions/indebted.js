// @flow

import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {getAreAllHeroesWounded, getIsOneHeroLeft, WOUND_REBEL_HERO} from '../rebels';
import {
  getCurrentRound,
  getMapStates,
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
import {REFER_CAMPAIGN_GUIDE, TARGET_HERO_CLOSEST_UNWOUNDED, TARGET_REMAINING} from './constants';
import createAction from '../createAction';
import {displayModal} from '../modal';
import handleStatusPhaseBegin from './sharedSagas/handleStatusPhaseBegin';
import helperDeploy from './helpers/helperDeploy';
import helperEventModal from './helpers/helperEventModal';
import helperIncreaseThreat from './helpers/helperIncreaseThreat';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import {missionSagaLoadDone} from '../app';
import type {StateType} from '../types';
import track from '../../lib/track';

// Constants

const TARGET_CLOSEST_ACTIVE_TERMINAL = 'the closest active terminal';
const TARGET_REMAINING_TERMINAL = 'the remaining terminal';
const TARGET_SHORTATHA = 'Shortatha';

const DEPLOYMENT_POINT_GREEN = 'The northern green deployment point';

// Types

export type IndebtedStateType = {
  allCannonsDisabled: boolean,
  priorityTargetKillHero: boolean,
};

// State

const initialState = {
  allCannonsDisabled: false,
  priorityTargetKillHero: false,
};

export default (state: IndebtedStateType = initialState, action: Object) => {
  switch (action.type) {
    case 'INDEBTED_SET_CANNONS_DISABLED':
      return {
        ...state,
        allCannonsDisabled: true,
      };
    case 'INDEBTED_PRIORITY_TARGET_KILL_HERO':
      return {
        ...state,
        priorityTargetKillHero: action.payload,
      };
    default:
      return state;
  }
};

// Selectors

const getState = (state: StateType) => state.indebted;
export const getIndebtedGoalText = (state: StateType): string[] => {
  const goals = [
    '{BOLD}Terminals:{END}',
    'A hero can interact ({TECH} or {STRENGTH}) to disable it.',
    '{BREAK}',
    '{BOLD}Cell Door:{END}',
    'The cell door opens when all terminals are disabled.',
    '{BREAK}',
    '{BOLD}Pulse Cannons:{END}',
    'Pulse cannons fire at a hero in LOS at the end of each round.',
    '{BREAK}',
    'A hero can interact with a cannon (2 {STRENGTH}) to disable it.',
    '{BREAK}',
    'If Gaarkhan is attacked by a cannon, he becomes focused.',
  ];

  return goals;
};

// Sagas

function* handleAllTerminalsActivated(): Generator<*, *, *> {
  while (true) {
    yield take(SET_MAP_STATE_ACTIVATED);
    const mapStates = yield select(getMapStates);
    let totalActivated = 0;

    if (mapStates['terminal-1'].activated) {
      totalActivated += 1;
    }
    if (mapStates['terminal-2'].activated) {
      totalActivated += 1;
    }
    if (mapStates['terminal-3'].activated) {
      totalActivated += 1;
    }
    // If 2 activated switch move
    if (totalActivated === 2) {
      const {priorityTargetKillHero} = yield select(getState);
      if (!priorityTargetKillHero) {
        yield put(setMoveTarget(TARGET_REMAINING_TERMINAL));
      }
    } else if (totalActivated === 3) {
      // Now check all 3 terminals, if they are activated, door opens
      track('indebted', 'prisonGuards', 'triggered');
      yield call(
        helperDeploy,
        'Prison Guards',
        REFER_CAMPAIGN_GUIDE,
        ['The door to the cell is now open.', 'An E-Web Engineer will now be deployed.'],
        ['eWebEngineer', 'Deploy to the yellow point.']
      );
      yield put(setMapStateActivated(1, 'door', true));
      const {priorityTargetKillHero} = yield select(getState);
      if (!priorityTargetKillHero) {
        yield put(setMoveTarget(TARGET_SHORTATHA));
      }
      // We're done
      break;
    }
  }
}

function* handleDivertPowerEvent(): Generator<*, *, *> {
  track('indebted', 'divertPower', 'triggered');
  yield call(helperEventModal, {
    story: REFER_CAMPAIGN_GUIDE,
    text: [
      'For the rest of the mission, when a pulse cannon fires, roll 2 red die instead of 1 red and 1 yellow.',
      'The threat will now be increased.',
    ],
    title: 'Divert power',
  });
  yield call(helperIncreaseThreat, 1);
}

function* handleCannonsDisabled(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {type, value} = action.payload;
    if (type === 'imperial' && value === true) {
      const mapStates = yield select(getMapStates);
      const results = [];
      if (mapStates['imperial-1'].activated) {
        results.push('imperial-1');
      }
      if (mapStates['imperial-2'].activated) {
        results.push('imperial-2');
      }
      if (mapStates['imperial-3'].activated) {
        results.push('imperial-3');
      }

      if (results.length === 2) {
        yield call(handleDivertPowerEvent);
      } else if (results.length === 3) {
        yield put(createAction('INDEBTED_SET_CANNONS_DISABLED', true));
        break;
      }
    }
  }
}

function* handlePulseCannonActivation(): Generator<*, *, *> {
  const {allCannonsDisabled} = yield select(getState);
  if (!allCannonsDisabled) {
    yield call(helperEventModal, {
      text: [
        'Each pulse cannon fires on the hero with least Health remaining in its line of sight.',
        'Roll one red die and one yellow die and deal damage equal to the {DAMAGE} rolled.',
        'If there is only 1 cannon left, roll 2 red die.',
      ],
      title: 'Pulse Cannons',
    });
  }
}

function* handleShortathaRescued(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'rebel' && value === true) {
      track('indebted', 'victory', 'rescued');
      yield put(displayModal('REBEL_VICTORY'));
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
      track('indebted', 'defeat', 'wounded');
      break;
    }
    const isOneHeroLeft = yield select(getIsOneHeroLeft);
    if (isOneHeroLeft) {
      // SWITCH TARGET
      yield put(createAction('INDEBTED_PRIORITY_TARGET_KILL_HERO', true));
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
      track('indebted', 'defeat', 'round');
      break;
    }

    // Fire pulse cannon
    yield call(handlePulseCannonActivation);

    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(helperInitialSetup, ['nexu', 'stormtrooperElite']);
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
    'A hero can interact with a terminal ({TECH} or {STRENGTH}) to disable the terminal.',
    'The door is locked. The door opens when all terminals are disabled.',
    'Imperial mission tokens are pulse cannons. At the end of each round, each cannon will fire on a hero that is in LOS with a red and yellow die, dealing damage equal to the {DAMAGE} rolled.',
    'If Gaarkhan is attacked with a cannon, he becomes focused.',
    'A hero can interact with a cannon (2 {STRENGTH}) to disable it.',
    'The Rebel mission token represents Shortatha. A hero can interact with the token to rescue him.',
  ]);
  yield put(missionSpecialSetupDone());
}

/*
Priority target definitions:
1) Initial attack is default, move is the closest active terminal
2) If two terminals are down, move is the last active terminal
3) If all activated, move is the cell door
4) Cell door open, move is Shortatha
*/
export function* indebted(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
  yield put(setMoveTarget(TARGET_CLOSEST_ACTIVE_TERMINAL));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN));

  yield all([
    fork(handleSpecialSetup),
    fork(handleAllTerminalsActivated),
    fork(handleCannonsDisabled),
    fork(handleShortathaRescued),
    fork(handleHeroesWounded),
    fork(handleStatusPhaseBegin),
    fork(handleRoundEnd),
  ]);

  track('missionStart', 'indebted');
  yield put(missionSagaLoadDone());
}
