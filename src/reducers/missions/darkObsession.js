// @flow

import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {DEFEAT_IMPERIAL_FIGURE, OPTIONAL_DEPLOYMENT_DONE, optionalDeployment} from '../imperials';
import {getAreAllHeroesWounded, WOUND_REBEL_HERO} from '../rebels';
import {
  getCurrentRound,
  getMapStates,
  MISSION_SPECIAL_SETUP,
  missionSpecialSetupDone,
  SET_MAP_STATE_ACTIVATED,
  setAttackTarget,
  setDeploymentPoint,
  setMapStateActivated,
  setMapStateInteractable,
  setMoveTarget,
  STATUS_PHASE_END_ROUND_EFFECTS,
  statusPhaseEndRoundEffectsDone,
} from '../mission';
import {REFER_CAMPAIGN_GUIDE, TARGET_HERO_CLOSEST_UNWOUNDED} from './constants';
import createAction from '../createAction';
import {displayModal} from '../modal';
import handleStatusPhaseBegin from './sharedSagas/handleStatusPhaseBegin';
import helperDeploy from './helpers/helperDeploy';
import helperEventModal from './helpers/helperEventModal';
import helperIncreaseThreat from './helpers/helperIncreaseThreat';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import {missionSagaLoadDone} from '../app';
import {setCustomUnitAI} from '../imperials';
import type {StateType} from '../types';
import track from '../../lib/track';

// Constants

const DEPLOYMENT_POINT_GREEN_N = 'The north green deployment point';
const DEPLOYMENT_POINT_GREEN_W = 'The west green deployment point';
const DEPLOYMENT_POINT_GREEN_S = 'The south green deployment point';
const DEPLOYMENT_POINT_BLUE = 'The blue deployment point';

const VADER_AI = [
  {
    "command": "{ACTION} Open the door.",
    "condition": "If within 3 spaces of a closed door",
  },
  {
    "command": "{ACTION} If necessary, move adjacent to those figures, then {ACTION} Use Brutality ability to attack those targets.",
    "condition": "If possible to be adjacent to 2 hostile figures (one being {ATTACK_TARGET})",
  },
  {
    "command": "{ACTION} Move adjacent to {ATTACK_TARGET}, then {ACTION} Attack {ATTACK_TARGET}.",
    "condition": "If within 4 spaces and have LOS of {ATTACK_TARGET}",
  },
  {
    "command": "{ACTION} Use Force Choke ability on {ATTACK_TARGET}, then {ACTION} Move towards {ATTACK_TARGET}.",
    "condition": "If not within 4 spaces of {ATTACK_TARGET} but have LOS",
  },
  {
    "command": "{ACTION} Move towards {ATTACK_TARGET}.",
    "condition": "If not within 4 spaces of {ATTACK_TARGET} and not LOS to any hostile figures",
  },
  {
    "command": "If {EVADE} does nothing, reroll it. Otherwise, reroll a die with 1 {BLOCK}.",
    "condition": "Reaction - While defending",
  },
];

const VADER_AI_SABOTAGE = [
  {
    "command": "{ACTION} Open the door.",
    "condition": "If within 3 spaces of a closed door",
  },
  {
    "command": "{ACTION} Move adjacent to the sabotage site ({ACTION} Repeat move if needed), then {ACTION} Interact with the sabotage site.",
    "condition": "If all heroes are wounded",
  },
];

// Types

export type DarkObsessionStateType = {
  reopenedDoors: number[],
};

// State

const initialState = {
  reopenedDoors: [],
};

export default (state: DarkObsessionStateType = initialState, action: Object) => {
  switch (action.type) {
    case 'DARK_OBSESSION_DOOR_REOPENED':
      return {
        ...state,
        reopenedDoors: state.reopenedDoors.concat(action.payload.doorId),
      };
    default:
      return state;
  }
};

// Selectors

const getState = (state: StateType) => state.darkObsession;
export const getDarkObsessionGoalText = (state: StateType): string[] => {
  let goals = [];

  goals = goals.concat([
    '{BOLD}Darth Vader:{END}',
    '{ELITE}Darth Vader{END} cannot be pushed. When he is attacked and is adjacent to an Imperial Trooper unit, the Trooper unit is attacked instead.',
    '{BREAK}',
    '{BOLD}Terminal:{END}',
    'Once per activation, a hero can interact ({TECH}) with the terminal to close an open door closest to the sabotage site.',
    '{BREAK}',
    '{BOLD}Doors:{END}',
    'Doors that have been reopened cannot be closed again.',
    'Doors are locked. A figure can attack a door to open it (Health: 5, Defense: 1 {BLOCK})',
  ]);

  return goals;
};

// Sagas

function getRandomDeploymentPoint() {
  const roll = Math.floor(Math.random() * 100);
  if (roll <= 33) {
    return DEPLOYMENT_POINT_GREEN_N;
  } else if (roll <= 66) {
    return DEPLOYMENT_POINT_GREEN_S;
  } else {
    return DEPLOYMENT_POINT_GREEN_W;
  }
}

function* handleSecurityBreach(): Generator<*, *, *> {
  track('darkObsession', 'securityBreach', 'triggered');
  yield call(helperIncreaseThreat, 1);
  yield call(
    helperDeploy,
    'Security Breach',
    REFER_CAMPAIGN_GUIDE,
    [
      'The threat has been increased by the threat level.',
      'A Stormtrooper group will now be deployed.',
    ],
    ['stormtrooper', 'Deploy to the blue deployment point.']
  );
  // Switch deployment to blue point
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_BLUE));
}

function* handleDoorReopened(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (type === 'door' && value === true) {
      yield put(setMapStateActivated(id, 'door', true));
      yield put(setMapStateInteractable(id, 'door', false));
      // Make it so it cannot be closed again
      yield put(createAction('DARK_OBSESSION_DOOR_REOPENED', {doorId: id}));
    }
  }
}

function* handleTerminal(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'terminal' && value === true) {
      // Close the door closest to sabotage site that has not been reopened
      const {reopenedDoors} = yield select(getState);
      const mapStates = yield select(getMapStates);

      // If door 3 is open and was not re-open, then close it
      if (mapStates['door-3'].activated && !reopenedDoors.includes(3)) {
        yield put(setMapStateActivated(3, 'door', false));
        yield put(setMapStateInteractable(3, 'door', true));
        yield call(helperEventModal, {
          text: ['Door 3 was closed shut.'],
          title: 'Dark Obsession',
        });
        track('darkObsession', 'doorClosed', '3');
      }
      // If door 2 is open and was not re-open, then close it
      else if (mapStates['door-2'].activated && !reopenedDoors.includes(2)) {
        yield put(setMapStateActivated(2, 'door', false));
        yield put(setMapStateInteractable(2, 'door', true));
        yield call(helperEventModal, {
          text: ['Door 2 was closed shut.'],
          title: 'Dark Obsession',
        });
        track('darkObsession', 'doorClosed', '2');
      }
      // If door 1 is open and was not re-open, then close it
      else if (mapStates['door-1'].activated && !reopenedDoors.includes(1)) {
        yield put(setMapStateActivated(1, 'door', false));
        yield put(setMapStateInteractable(1, 'door', true));
        yield call(helperEventModal, {
          text: ['Door 1 was closed shut.'],
          title: 'Dark Obsession',
        });
        track('darkObsession', 'doorClosed', '1');
      }

      // Unactivate the terminal so it can be used again
      yield put(setMapStateActivated(1, 'terminal', false));
    }
  }
}

function* handleLukeLocated(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'rebel' && value === true) {
      yield put(displayModal('IMPERIAL_VICTORY'));
      track('darkObsession', 'defeat', 'lukeLocated');
      break;
    }
  }
}

function* handleVaderKilled(): Generator<*, *, *> {
  while (true) {
    const action = yield take(DEFEAT_IMPERIAL_FIGURE);
    const {group} = action.payload;
    if (group.id === 'darthVader') {
      yield put(displayModal('REBEL_VICTORY'));
      track('darkObsession', 'victory', 'darthVader');
      break;
    }
  }
}

function* handleAllHeroesWounded(): Generator<*, *, *> {
  while (true) {
    yield take(WOUND_REBEL_HERO);
    const allHeroesWounded = yield select(getAreAllHeroesWounded);
    if (allHeroesWounded) {
      yield call(helperEventModal, {
        text: ['{ELITE}Darth Vader{END} can now use the sabotage site to locate Luke.'],
        title: 'Dark Obsession',
      });
      yield put(setMapStateInteractable(1, 'rebel', true));
      yield put(setCustomUnitAI('darthVader', VADER_AI_SABOTAGE));
    }
  }
}

// REQUIRED SAGA
function* handleRoundEnd(): Generator<*, *, *> {
  while (true) {
    yield take(STATUS_PHASE_END_ROUND_EFFECTS);
    const currentRound = yield select(getCurrentRound);

    if (currentRound === 1) {
      yield call(handleSecurityBreach);
    } else if (currentRound === 3) {
      track('darkObsession', 'powerOfTheDarkSide', 'triggered');
      yield call(helperEventModal, {
        story: REFER_CAMPAIGN_GUIDE,
        text: ['The threat has been increased by the threat level.'],
        title: 'Power of the Dark Side',
      });
      yield call(helperIncreaseThreat, 1);
    } else if (currentRound === 6) {
      // End game with rebel victory
      yield put(displayModal('REBEL_VICTORY'));
      track('darkObsession', 'victory', 'round');
      break;
    }

    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(helperInitialSetup, ['darthVader', 'stormtrooperElite']);
  yield call(helperEventModal, {
    text: [
      'The heroes cannot bring {ELITE}Luke Skywalker{END} to this mission.',
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

  yield call(helperMissionBriefing, [
    'The red rebel mission token is the sabotage site. When all heroes are wounded, {ELITE}Darth Vader{END} can interact with it to locate Luke.',
    '{ELITE}Darth Vader{END} cannot be pushed. When he is attacked and is adjacent to an Imperial Trooper unit, the Trooper unit is attacked instead.',
    'All doors start open.',
    'Once per activation, a hero can interact ({TECH}) with the terminal to close an open door closest to the sabotage site. Doors that have been reopened cannot be closed again.',
    'Once doors are closed, they are locked. A figure can attack a door to open it (Health: 5, Defense: 1 {BLOCK})',
  ]);
  yield put(missionSpecialSetupDone());
}

/*
Priority target definitions:
1) Initial attack is closest unwounded hero, move is the same
*/
export function* darkObsession(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
  yield put(setMoveTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(getRandomDeploymentPoint()));

  yield put(setCustomUnitAI('darthVader', VADER_AI));

  yield all([
    fork(handleSpecialSetup),
    fork(handleDoorReopened),
    fork(handleTerminal),
    fork(handleLukeLocated),
    fork(handleVaderKilled),
    fork(handleAllHeroesWounded),
    fork(handleStatusPhaseBegin),
    fork(handleRoundEnd),
  ]);

  track('missionStart', 'darkObsession');
  yield put(missionSagaLoadDone());
}
