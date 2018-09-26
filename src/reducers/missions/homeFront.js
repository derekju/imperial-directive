// @flow

import {
  ACTIVATION_PHASE_BEGIN,
  getCurrentRound,
  getMapStates,
  increaseThreat,
  MISSION_SPECIAL_SETUP,
  missionSpecialSetupDone,
  SET_MAP_STATE_ACTIVATED,
  setAttackTarget,
  setDeploymentPoint,
  setMapStateActivated,
  setMapStateInteractable,
  setMapStateVisible,
  setMoveTarget,
  STATUS_PHASE_END_ROUND_EFFECTS,
  statusPhaseEndRoundEffectsDone,
  updateRebelVictory,
} from '../mission';
import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {
  getLastDeployedGroupOfId,
  setCustomUnitAI,
  setImperialUnitHpBuff,
  silentSetImperialGroupActivated,
} from '../imperials';
import {
  GUARDIANS_LIST,
  REFER_CAMPAIGN_GUIDE,
  TARGET_CLOSEST_REBEL,
  TROOPERS_LIST,
} from './constants';
import createAction from '../createAction';
import getRandomItem from '../utils/getRandomItem';
import handleImperialKilledToWin from './sharedSagas/handleImperialKilledToWin';
import handleObjectsAllActivated from './sharedSagas/handleObjectsAllActivated';
import handleStatusPhaseBegin from './sharedSagas/handleStatusPhaseBegin';
import helperDeploy from './helpers/helperDeploy';
import helperEventModal from './helpers/helperEventModal';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import helperShowInterruptedGroup from './helpers/helperShowInterruptedGroup';
import missions from '../../data/missions';
import {missionSagaLoadDone} from '../app';
import {SET_REBEL_ACTIVATED} from '../rebels';
import shuffle from 'lodash/shuffle';
import snakeCase from 'lodash/snakeCase';
import type {StateType} from '../types';
import track from '../../lib/track';

// Constants

const MISSION_NAME = 'homeFront';
const MISSION_NAME_S = snakeCase(MISSION_NAME).toUpperCase();

const TARGET_BARRICADE = 'the Barricade';
const TARGET_REFUGEE_DOOR = 'the farthest refugee (or door in front of) from any Rebel unit';

const DEPLOYMENT_POINT_GREEN = 'The south green deployment point';
const DEPLOYMENT_POINT_RED = 'The red deployment point';

const CUSTOM_TROOPER_GUARDIAN_AI = [
  {
    command:
      '{ACTION} Move to be adjacent to Jann or as close as possible if no spaces around Jann',
    condition: 'If not adjacent to Jann',
  },
  {
    command: '{ACTION} Attack the door or refugee',
    condition: 'If within attack range (4 spaces ranged, 2 melee with reach) of a door or refugee',
  },
];

// Types

export type HomeFrontStateType = {
  barricadeDestroyed: boolean,
  bombardmentOptions: boolean[],
  priorityTargetKillHero: boolean,
};

// State

const initialState = {
  barricadeDestroyed: false,
  bombardmentOptions: [false, false, false],
  priorityTargetKillHero: false,
};

export default (state: HomeFrontStateType = initialState, action: Object) => {
  switch (action.type) {
    case `${MISSION_NAME_S}_PRIORITY_TARGET_KILL_HERO`:
      return {
        ...state,
        priorityTargetKillHero: action.payload,
      };
    case 'HOME_FRONT_BARRICADE_DESTROYED':
      return {
        ...state,
        barricadeDestroyed: true,
      };
    case 'HOME_FRONT_SET_BOMBARDMENT_OPTION':
      // $FlowFixMe
      const newOptions = state.bombardmentOptions.slice();
      newOptions[action.payload.id] = true;
      return {
        ...state,
        bombardmentOptions: newOptions,
      };
    default:
      return state;
  }
};

// Selectors

const getState = (state: StateType) => state[MISSION_NAME];
export const getHomeFrontGoalText = (state: StateType): string[] => {
  let goals = [];

  const {barricadeDestroyed} = state.homeFront;

  if (!barricadeDestroyed) {
    goals = goals.concat([
      '{BOLD}Current Goal:{END}',
      'Destroy the barricade.',
      '{BREAK}',
      '{BOLD}Barricade:{END}',
      'Blocking terrain. The 4 neutral tokens represent one single barricade (Health: 8, Defense: 1 {BLOCK}).',
      '{BREAK}',
      'At end of round if not destroyed, Imperials can choose 1 refugee to discard.',
      '{BREAK}',
    ]);
  } else {
    goals = goals.concat([
      '{BOLD}Jann:{END}',
      'Performs 1 activation after each Rebel activation instead of activating normally.',
      '{BREAK}',
      'When attacked, if there is adjacent Trooper or Guardian unit, that unit is attacked instead.',
      '{BREAK}',
    ]);
  }

  goals = goals.concat([
    '{BOLD}Refugee:{END}',
    'Rebel mission tokens. Can be attacked by Imperials (Health: 3, Defense: 1 white die). Apply +1 Health if Rebels have a Boon.',
    '{BREAK}',
    "When attacked, if there is an adjacent Rebel figure, apply +1 {BLOCK} to the defense results and the heroes may re-roll the refugee's defense die once.",
    '{BREAK}',
    '{BOLD}Doors:{END}',
    'Locked. Imperial figures can attack (Health: 5, Defense: None).',
    '{BREAK}',
    'Doors adjacent to a Rebel figure do not block movement, LOS, adjacency, or counting spaces.',
  ]);

  return goals;
};

// Sagas

function* handleBombardment(): Generator<*, *, *> {
  yield put(increaseThreat(2));

  yield call(helperEventModal, {
    text: ['The threat has been increased by 2.'],
    title: 'Bombardment',
  });

  // Just pick a random one, it's easier
  const {barricadeDestroyed, bombardmentOptions} = yield select(getState);
  const optionsToPick = [];
  bombardmentOptions.forEach((v: boolean, i: number) => !v && optionsToPick.push(i));

  const randomIndex = getRandomItem(...optionsToPick);

  if (randomIndex === 0) {
    const deploymentPlace = barricadeDestroyed
      ? 'Deploy next to Jann.'
      : 'Deploy next to the barricade.';

    yield call(
      helperDeploy,
      'Bombardment',
      REFER_CAMPAIGN_GUIDE,
      ['An {ELITE}Elite Probe Droid{END} will now be deployed.'],
      ['probeDroidElite', deploymentPlace]
    );

    yield put(createAction('HOME_FRONT_SET_BOMBARDMENT_OPTION', {id: 0}));
  } else if (randomIndex === 1) {
    yield call(helperEventModal, {
      story: REFER_CAMPAIGN_GUIDE,
      text: [
        'Choose a closed door with the most Rebel figures at least 2 spaces of it. Roll 1 red die and each Rebel figure within 2 spaces of the door suffers {DAMAGE} equal to the {DAMAGE} results.',
      ],
      title: 'Bombardment',
    });
    yield put(createAction('HOME_FRONT_SET_BOMBARDMENT_OPTION', {id: 1}));
  } else if (randomIndex === 2) {
    yield call(helperEventModal, {
      story: REFER_CAMPAIGN_GUIDE,
      text: ['Each hero suffers 1 {STRAIN} for each activation token he has and becomes Weakened.'],
      title: 'Bombardment',
    });
    yield put(createAction('HOME_FRONT_SET_BOMBARDMENT_OPTION', {id: 2}));
  }
}

function* handleTheRaid(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if ([1, 2, 3, 4].includes(id) && type === 'neutral' && value === true) {
      track(MISSION_NAME, 'theRaid', 'triggered');

      yield put(createAction('HOME_FRONT_BARRICADE_DESTROYED'));

      // Hide all of the neutral tokens since the entire barricade is gone
      yield put(setMapStateVisible(1, 'neutral', false));
      yield put(setMapStateVisible(2, 'neutral', false));
      yield put(setMapStateVisible(3, 'neutral', false));
      yield put(setMapStateVisible(4, 'neutral', false));

      yield call(
        helperDeploy,
        'The Raid',
        '',
        [
          '{ELITE}Jann{END} (Imperial Officer) and an E-Web Engineer will now be deployed.',
          'Jann gains +10 Health.',
        ],
        ['jann', 'Deploy to the red deployment point.'],
        ['eWebEngineer', 'Deploy to the red deployment point.']
      );

      yield put(setDeploymentPoint(DEPLOYMENT_POINT_RED));

      yield put(setImperialUnitHpBuff('jann', 10));

      yield call(helperEventModal, {
        text: [
          'When Jann is attacked and there is an adjacent friendly Trooper or Guardian who could be targeted, that figure is targeted instead.',
          'Instead of activating as normal, Jann performs 1 action after each Rebel activation.',
          'The Rebels win when Jann is defeated.',
        ],
        title: 'The Raid',
      });

      yield put(updateRebelVictory('When Jann is defeated'));

      // Manually set him as activated so he doesn't activate as normal after this time
      const group = yield select(getLastDeployedGroupOfId, 'jann');
      yield put(silentSetImperialGroupActivated(group));

      yield fork(handleJannActivations);

      // Set custom AI here for all units
      // Once the barricade is out and Jann is out, Imperials need to attack as many refugees as possible and also
      // the doors blocking the refugees. Problem is if Jann is killed then they lose and it helps to have troopers
      // or guardians huddle around him. So maybe what we should do is set custom AI for all troopers and guardians
      // to hover around him. Everyone else disperses and targets the farthest Refugee away from the Rebels.
      yield put(setAttackTarget(TARGET_REFUGEE_DOOR));
      yield put(setMoveTarget(TARGET_REFUGEE_DOOR));

      yield put(setCustomUnitAI([...TROOPERS_LIST, ...GUARDIANS_LIST], CUSTOM_TROOPER_GUARDIAN_AI));

      // We're done
      break;
    }
  }
}

function* handleJannActivations(): Generator<*, *, *> {
  while (true) {
    yield take(SET_REBEL_ACTIVATED);
    yield call(helperShowInterruptedGroup, 'jann');
  }
}

function* discardRandomRefugee(): Generator<*, *, *> {
  // Shuffle an array of all the tokens are iterate through until we find one that we can discard
  const tokens = shuffle([1, 2, 3, 4, 5, 6, 7, 8]);
  const mapStates = yield select(getMapStates);
  for (let i = 0; i < tokens.length; i++) {
    const t = `rebel-${tokens[i]}`;
    if (!mapStates[t].activated) {
      yield put(setMapStateActivated(tokens[i], 'rebel', true));
      // TODO: This is breaking the helper checking map state activations for end game conditions
      // Not really a problem since I doubt someone will not destroy the barrier in 8 rounds
      // but flagging this here since it is a known bug
      yield call(helperEventModal, {
        text: [
          `A refugee was discarded (R${tokens[i]}) since the barricade has not been destroyed yet.`,
        ],
        title: 'Home Front',
      });
      break;
    }
  }
}

function* handleRoundStart(): Generator<*, *, *> {
  while (true) {
    yield take(ACTIVATION_PHASE_BEGIN);
    const state = yield select(getState);
    const {barricadeDestroyed} = state;
    // Check if we need to manually exhaust Jann
    if (barricadeDestroyed) {
      const group = yield select(getLastDeployedGroupOfId, 'jann');
      yield put(silentSetImperialGroupActivated(group));
    }
  }
}

// REQUIRED SAGA
function* handleRoundEnd(): Generator<*, *, *> {
  while (true) {
    yield take(STATUS_PHASE_END_ROUND_EFFECTS);
    const currentRound = yield select(getCurrentRound);

    const state = yield select(getState);
    const {barricadeDestroyed} = state;
    if (!barricadeDestroyed) {
      // Pick a random refugee and discard it
      yield call(discardRandomRefugee);
    }

    if ([2, 4, 5].includes(currentRound)) {
      yield call(handleBombardment);
    }

    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(helperInitialSetup, missions[MISSION_NAME].initialGroups);

  yield call(helperMissionBriefing, [
    'The neutral mission tokens represent a single barricade that is blocking terrain. A Rebel figure can attack the barricade (Health: 8, Defense: 1 {BLOCK}) to discard it.',
    'The Rebel mission tokens are refugees. A refugee can be attacked (Health: 3, Defense: 1 white die). Each refugee gets +1 Health for each Boon the heroes control.',
    "If there is a healthy Rebel figure adjacent to a refugee when it is attacked, apply +1 {BLOCK} to the results and the hero may reroll the refugee's defense die.",
    'Doors are locked. An Imperial figure can attack a door (Health: 5, Defense: None).',
    'A door adjacent to a Rebel figure does not block movement, LOS, adjacency, or counting spaces.',
    'At the end of each Round, if the barricade is not destroyed, the Imperials choose a door or refugee to destroy or discard.',
  ]);

  yield put(missionSpecialSetupDone());
}

// OK, in the beginning the barricade is blocking everything and no one can pass it. So Imperials should try and block the barricade
// as much as posible.
export function* homeFront(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_CLOSEST_REBEL));
  yield put(setMoveTarget(TARGET_BARRICADE));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN));

  yield all([
    fork(handleSpecialSetup),
    fork(handleTheRaid),
    fork(
      handleObjectsAllActivated(
        ['rebel-1', 'rebel-2', 'rebel-3', 'rebel-4', 'rebel-5', 'rebel-6', 'rebel-7', 'rebel-8'],
        MISSION_NAME,
        'IMPERIAL_VICTORY',
        'defeat',
        'refugees'
      )
    ),
    fork(handleImperialKilledToWin('jann', 'homeFront')),
    fork(handleStatusPhaseBegin),
    fork(handleRoundStart),
    fork(handleRoundEnd),
  ]);

  track('missionStart', MISSION_NAME);
  yield put(missionSagaLoadDone());
}
