// @flow

import {
  MISSION_SPECIAL_SETUP,
  missionSpecialSetupDone,
  SET_MAP_STATE_ACTIVATED,
  setAttackTarget,
  setDeploymentPoint,
  setMapStateVisible,
  setMoveTarget,
  STATUS_PHASE_END_ROUND_EFFECTS,
  statusPhaseEndRoundEffectsDone,
} from '../mission';
import {addToRoster, WOUND_REBEL_HERO, WOUND_REBEL_OTHER} from '../rebels';
import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {OPTIONAL_DEPLOYMENT_DONE, optionalDeployment} from '../imperials';
import {displayModal} from '../modal';
import handleHeroesWounded from './sharedSagas/handleHeroesWounded';
import handleStatusPhaseBegin from './sharedSagas/handleStatusPhaseBegin';
import helperChoiceModal from './helpers/helperChoiceModal';
import helperDeploy from './helpers/helperDeploy';
import helperEventModal from './helpers/helperEventModal';
import helperIncreaseThreat from './helpers/helperIncreaseThreat';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import {missionSagaLoadDone} from '../app';
import {REFER_CAMPAIGN_GUIDE} from './constants';
import {setCustomUnitAI} from '../imperials';
import type {StateType} from '../types';
import track from '../../lib/track';

// Constants

const TARGET_HERO_TOKEN = 'closest unwounded hero (carrying a token if possible)';

const DEPLOYMENT_POINT_GREEN_N = 'The north green deployment point';
const DEPLOYMENT_POINT_GREEN_E = 'The east green deployment point';
const DEPLOYMENT_POINT_GREEN_S = 'The south green deployment point';

const STORMTROOPER_AI_TOKENS = [
  {
    command:
      '{ACTION} Move within 4 spaces and LOS of {ATTACK_TARGET} (next to a friendly Trooper if possible), then {ACTION} Attack {ATTACK_TARGET}, then move to the closest neutral mission token.',
    condition: 'If within 8 spaces of a hero with a collected token',
  },
  {
    command:
      '{ACTION} Move adjacent to the neutral mission token, then {ACTION} Interact to collect the token, then move as far from any Rebel unit as possible.',
    condition: 'If within 4 spaces of a neutral mission token',
  },
  {
    command:
      '{ACTION} Move towards the closest neutral mission token, then {ACTION} Move towards the closest neutral mission token.',
    condition: 'If not within 4 spaces of a neutral mission token',
  },
];

// Types

export type SympathyForTheRebellionStateType = {
  heroTokensClaimed: number,
  imperialTokensClaimed: number,
  priorityTargetKillHero: boolean,
};

// State

const initialState = {
  heroTokensClaimed: 0,
  imperialTokensClaimed: 0,
  priorityTargetKillHero: false,
};

export default (state: SympathyForTheRebellionStateType = initialState, action: Object) => {
  switch (action.type) {
    case 'SYMPATHY_FOR_THE_REBELLION_PRIORITY_TARGET_KILL_HERO':
      return {
        ...state,
        priorityTargetKillHero: action.payload,
      };
    case 'SYMPATHY_FOR_THE_REBELLION_HERO_CLAIM':
      return {
        ...state,
        heroTokensClaimed: state.heroTokensClaimed + 1,
      };
    case 'SYMPATHY_FOR_THE_REBELLION_IMPERIAL_CLAIMED':
    case 'SYMPATHY_FOR_THE_REBELLION_IMPERIAL_DEFEAT_REBEL':
      return {
        ...state,
        imperialTokensClaimed: state.imperialTokensClaimed + 1,
      };
    default:
      return state;
  }
};

// Selectors

const getState = (state: StateType) => state.sympathyForTheRebellion;
export const getSympathyForTheRebellionGoalText = (state: StateType): string[] => {
  let goals = [];

  const heroesOwned = state.sympathyForTheRebellion.heroTokensClaimed;
  const imperialOwned = state.sympathyForTheRebellion.imperialTokensClaimed;

  goals = goals.concat([
    '{BOLD}Neutral tokens (Recruits):{END}',
    'Healthy heroes and Stormtroopers can interact to retrieve a recruit. A figure can carry max 1 recruit at a time.',
    '{BREAK}',
    `Heroes Owned: ${heroesOwned}`,
    `Imperial Owned: ${imperialOwned}`,
    '{BREAK}',
    '{BOLD}Rebel tokens (Exits):{END}',
    'When a hero carrying a recruit enters an exit, the heroes can claim the mission token.',
    '{BREAK}',
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
    return DEPLOYMENT_POINT_GREEN_E;
  }
}

function* handleRecruitCollection(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (type === 'neutral' && value === true) {
      // Ask who is collecting it
      const response = yield call(
        helperChoiceModal,
        'Which player is retrieving the recruit?',
        'Collecting Recruit',
        'Rebels',
        'Imperials'
      );

      if (response === 'yes') {
        yield call(helperEventModal, {
          text: ['Enter an exit with the hero carrying the token to retrieve the recruit.'],
          title: 'Recruit Retrieval',
        });
      } else {
        yield call(helperEventModal, {
          text: [
            'If the Stormtrooper is still carrying the token at the end of the round, he will collect the recruit then.',
          ],
          title: 'Recruit Retrieval',
        });
      }

      // Hide the token
      yield put(setMapStateVisible(id, type, false));
    }
  }
}

function* handleImperialClaimToken(): Generator<*, *, *> {
  while (true) {
    const action = yield take([
      'SYMPATHY_FOR_THE_REBELLION_IMPERIAL_CLAIMED',
      'SYMPATHY_FOR_THE_REBELLION_IMPERIAL_DEFEAT_REBEL',
    ]);

    if (action.type === 'SYMPATHY_FOR_THE_REBELLION_IMPERIAL_CLAIMED') {
      // Increase threat by threat level
      yield call(helperIncreaseThreat, 1);

      yield call(helperEventModal, {
        text: [
          'The threat has been increased.',
          'Make sure to manually defeat the figure that was carrying the token.',
        ],
        title: 'Imperial Collected Recruit',
      });
    } else {
      yield call(helperEventModal, {
        text: [
          'A token was added for the Imperials.',
          'Make sure to manually remove the token from the map.',
        ],
        title: 'Imperial Defeated Rebel',
      });
    }

    const {imperialTokensClaimed} = yield select(getState);
    if (imperialTokensClaimed === 8) {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      track('sympathyForTheRebellion', 'defeat', 'recruits');
      // We're done
      break;
    }
  }
}

function* handleHeroClaimToken(): Generator<*, *, *> {
  while (true) {
    yield take('SYMPATHY_FOR_THE_REBELLION_HERO_CLAIM');
    const {heroTokensClaimed} = yield select(getState);
    if (heroTokensClaimed === 4) {
      track('sympathyForTheRebellion', 'hesHere', 'triggered');

      yield call(
        helperDeploy,
        "He's Here",
        REFER_CAMPAIGN_GUIDE,
        ['Deploy {ELITE}Darth Vader{END} to the red point.'],
        ['darthVader', 'Deploy to the red point.']
      );
    } else if (heroTokensClaimed === 5) {
      yield put(displayModal('REBEL_VICTORY'));
      track('sympathyForTheRebellion', 'victory', 'recruits');
      // We're done
      break;
    }
  }
}

function* handleHeroOrLukeDefeated(): Generator<*, *, *> {
  while (true) {
    yield take([WOUND_REBEL_HERO, WOUND_REBEL_OTHER]);
    yield call(helperEventModal, {
      text: [
        'The Imperials can collect 1 token (2 if it was a hero with 2 activation tokens).',
        'Manually activate the token closest to a Hero to remove the token from the map.',
        'Use the controls in the Goal Panel to add the token.',
      ],
      title: 'Rebel Defeated',
    });
  }
}

// REQUIRED SAGA
function* handleRoundEnd(): Generator<*, *, *> {
  while (true) {
    yield take(STATUS_PHASE_END_ROUND_EFFECTS);

    // Change deployment point to a random one at the end of each round
    yield put(setDeploymentPoint(getRandomDeploymentPoint()));

    const response = yield call(
      helperChoiceModal,
      'Does the Imperial player have any tokens?',
      'Imperial Recruits'
    );

    if (response === 'yes') {
      yield call(helperEventModal, {
        text: [
          'Use the controls in the Goal Panel to mark how many tokens the Imperial player has.',
        ],
        title: 'Imperial Recruits',
      });
    } else {
      yield put(statusPhaseEndRoundEffectsDone());
    }
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(helperInitialSetup, ['stormtrooper', 'stormtrooper', 'stormtrooperElite']);
  yield call(helperEventModal, {
    text: [
      'The heroes control {ELITE}Luke Skywalker{END} (Hero of the Rebellion) as an ally.',
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

  // Deploy Chewy
  yield put(addToRoster('luke'));

  yield call(helperMissionBriefing, [
    'Neutral mission tokens are recruits. Healthy heroes and Stormtroopers can interact to retrieve a recruit. A figure can carry max 1 recruit at a time.',
    'Rebel mission tokens are exits. When a hero carrying a recruit enters an exit, the heroes can claim the mission token.',
    'At the end of each round, the Imperials discards each Imperial figure carrying a recruit from the map. Then he claims the recruit tokens and gains threat equal to the number of tokens claimed.',
    'When a hero or {ELITE}Luke Skywalker{END} is defeated, the Imperial player claims one unclaimed token (2 if the hero has 2 activation tokens).',
  ]);
  yield put(missionSpecialSetupDone());
}

/*
Priority target definitions:
1) Initial attack is hero with a token or closest unwounded, move is the same
Except for stormtroopers.
*/
export function* sympathyForTheRebellion(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_HERO_TOKEN));
  yield put(setMoveTarget(TARGET_HERO_TOKEN));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(getRandomDeploymentPoint()));

  // Stormtrooper ai is to go towards nearest token, then once the unit has it to run far away
  // TODO: Improvement!
  // For deployment/reinforcement need to prioritize stormtroopers since they are needed to get tokens
  // 6.04.18 - Not going to do this for now to not worry about it but see if this will really be a problem
  yield put(setCustomUnitAI('stormtrooper', STORMTROOPER_AI_TOKENS));
  yield put(setCustomUnitAI('stormtrooperElite', STORMTROOPER_AI_TOKENS));

  yield all([
    fork(handleSpecialSetup),
    fork(handleRecruitCollection),
    fork(handleImperialClaimToken),
    fork(handleHeroClaimToken),
    fork(handleHeroOrLukeDefeated),
    fork(
      handleHeroesWounded(
        'sympathyForTheRebellion',
        'SYMPATHY_FOR_THE_REBELLION_PRIORITY_TARGET_KILL_HERO'
      )
    ),
    fork(handleStatusPhaseBegin),
    fork(handleRoundEnd),
  ]);

  track('missionStart', 'sympathyForTheRebellion');
  yield put(missionSagaLoadDone());
}
