// @flow

import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {DEFEAT_IMPERIAL_FIGURE, OPTIONAL_DEPLOYMENT_DONE, optionalDeployment} from '../imperials';
import {getCanHeroActivateTwice, getIsHeroWithdrawn, WOUND_REBEL_HERO} from '../rebels';
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
  updateRebelVictory,
} from '../mission';
import {getMissionThreat, missionSagaLoadDone} from '../app';
import createAction from '../createAction';
import {displayModal} from '../modal';
import handleStatusPhaseBegin from './sharedSagas/handleStatusPhaseBegin';
import helperDeploy from './helpers/helperDeploy';
import helperEventModal from './helpers/helperEventModal';
import helperIncreaseThreat from './helpers/helperIncreaseThreat';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import {REFER_CAMPAIGN_GUIDE} from './constants';
import type {StateType} from '../types';
import track from '../../lib/track';
import waitForModal from '../../sagas/waitForModal';

// Constants

const TARGET_DIALA = 'Diala';
const TARGET_DOOR = 'the door';

const DEPLOYMENT_POINT_DOOR = 'Next to the door to the Holocron Chamber';
const DEPLOYMENT_POINT_DIALA = 'Adjacent to Diala';

// Types

export type TemptationStateType = {
  doorOpen: boolean,
  tokensLeft: number,
};

// State

const initialState = {
  doorOpen: false,
  tokensLeft: 8,
};

export default (state: TemptationStateType = initialState, action: Object) => {
  switch (action.type) {
    case 'TEMPTATION_DOOR_OPEN':
      return {
        ...state,
        doorOpen: true,
      };
    case 'TEMPTATION_DECREMENT_TOKEN':
      return {
        ...state,
        tokensLeft: state.tokensLeft - action.payload.amount,
      };
    default:
      return state;
  }
};

// Selectors

const getState = (state: StateType) => state.temptation;
export const getTemptationGoalText = (state: StateType): string[] => {
  if (state.temptation.doorOpen) {
    return [
      '{BOLD}Darth Vader:{END}',
      `Darth Vader has health equal to ${state.app.missionThreat * 2}.`,
    ];
  } else {
    return ['{BOLD}Current Goal:{END}', 'Open the door to the Holocron Chamber'];
  }
};

// Sagas

function* handleAllureOfPower(): Generator<*, *, *> {
  yield put(
    displayModal('CHOICE_MODAL', {
      noText: 'Discard 1 token',
      question: [
        'Choose 1 of the following',
        'Discard 1 token from Diala to move up to 2 spaces. Then, perform up to 2 attacks.',
        'Claim 1 token and each other hero within 3 spaces recovers 2 {DAMAGE} and 2 {STRAIN}. Then, activate the closest Imperial figure to Diala and have them perform a move and attack.',
      ],
      story: 'The lure of power tempts Diala...',
      title: 'Allure of Power',
      yesText: 'Claim 1 token',
    })
  );
  yield call(waitForModal('CHOICE_MODAL'));
  const response = yield take('CHOICE_MODAL_ANSWER');
  const {answer} = response.payload;
  if (answer === 'yes') {
    yield put(createAction('TEMPTATION_DECREMENT_TOKEN', {amount: -1}));
    yield call(helperEventModal, {
      story: 'Diala calms her spirit and heals her teammates, but not without drawing attention.',
      text: [
        'Claim 1 token.',
        'Each other hero within 3 spaces recovers 2 {DAMAGE} and 2 {STRAIN}.',
        'Activate the closest Imperial figure to Diala and have them perform a move and attack if possible.',
      ],
      title: 'Allure of Power',
    });
  } else {
    yield put(createAction('TEMPTATION_DECREMENT_TOKEN', {amount: 1}));
    yield call(helperEventModal, {
      story: 'With a battle cry Diala springs to life!',
      text: ['Discard 1 token.', 'Move up to 2 spaces.', 'Perform up to 2 attacks.'],
      title: 'Allure of Power',
    });
  }
}

function* handleHatredEvent(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'door' && value === true) {
      track('temptation', 'hatred', 'triggered');
      const missionThreat = yield select(getMissionThreat);

      yield call(
        helperDeploy,
        REFER_CAMPAIGN_GUIDE,
        [
          'Deploy Darth Vader to the red point.',
          `Darth Vader has health equal to ${missionThreat * 2}. When he is defeated you win.`,
        ],
        'Hatred',
        ['darthVader']
      );
      yield put(createAction('TEMPTATION_DOOR_OPEN', true));
      yield put(updateRebelVictory('Defeat Darth Vader'));
      // SWITCH TARGET
      yield put(setMoveTarget(TARGET_DIALA));
      yield put(setDeploymentPoint(DEPLOYMENT_POINT_DIALA));
      // We're done
      break;
    }
  }
}

function* handleDefeatVader(): Generator<*, *, *> {
  while (true) {
    const action = yield take(DEFEAT_IMPERIAL_FIGURE);
    const {group} = action.payload;
    if (group.id === 'darthVader') {
      yield put(displayModal('REBEL_VICTORY'));
      track('temptation', 'victory', 'darthVader');
      break;
    }
  }
}

function* handleTokensDepleted(): Generator<*, *, *> {
  while (true) {
    yield take('TEMPTATION_DECREMENT_TOKEN');
    const currentState = yield select(getState);
    const {tokensLeft} = currentState;

    if (tokensLeft <= 0) {
      yield put(displayModal('IMPERIAL_VICTORY'));
      track('temptation', 'defeat', 'tokens');
      break;
    }
  }
}

function* handleHeroesWounded(): Generator<*, *, *> {
  while (true) {
    const action = yield take(WOUND_REBEL_HERO);
    const {id} = action.payload;
    const isHeroWithdrawn = yield select(getIsHeroWithdrawn, id);

    // Handle Diala dying
    if (id === 'diala' && isHeroWithdrawn) {
      yield put(displayModal('IMPERIAL_VICTORY'));
      track('temptation', 'defeat', 'withdrawn');
      break;
    } else {
      if (!isHeroWithdrawn) {
        yield call(helperEventModal, {
          text: [
            'Discard 1 Rebel mission token from Diala for each activation token the wounded hero possesses.',
          ],
          title: 'Hero Wounded',
        });
        // Figure out if they got double activation
        const canHeroActivateTwice = yield select(getCanHeroActivateTwice, id);
        if (canHeroActivateTwice) {
          yield put(createAction('TEMPTATION_DECREMENT_TOKEN', {amount: 2}));
        } else {
          yield put(createAction('TEMPTATION_DECREMENT_TOKEN', {amount: 1}));
        }
      }
    }
  }
}

// REQUIRED SAGA
function* handleRoundEnd(): Generator<*, *, *> {
  while (true) {
    yield take(STATUS_PHASE_END_ROUND_EFFECTS);

    // Do forced discard
    yield call(helperEventModal, {
      text: ['Discard 1 Rebel token from Diala.'],
      title: 'Inner Strength',
    });
    yield put(createAction('TEMPTATION_DECREMENT_TOKEN', {amount: 1}));

    yield put(
      displayModal('CHOICE_MODAL', {
        question: 'Have Diala test {INSIGHT}. Did she pass?',
        title: 'Inner Strength',
      })
    );
    yield call(waitForModal('CHOICE_MODAL'));
    const response = yield take('CHOICE_MODAL_ANSWER');
    const {answer} = response.payload;
    if (answer === 'no') {
      yield call(helperEventModal, {
        text: ['Discard an additional Rebel token from Diala.'],
        title: 'Inner Strength',
      });
      yield put(createAction('TEMPTATION_DECREMENT_TOKEN', {amount: 1}));
    }

    // Do Allure of Power
    const currentRound = yield select(getCurrentRound);
    if ([1, 3, 5].includes(currentRound)) {
      yield call(handleAllureOfPower);
    }

    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(helperInitialSetup, '{ELITE}Nexu{END}, Royal Guard, Stormtrooper');
  yield call(helperEventModal, {
    text: [
      "Place 8 Rebel mission tokens in Diala's play area.",
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
    'Rebel mission tokens represent inner strength.',
    'During each Status Phase, discard 1 token. Then, Diala tests {INSIGHT}. If she fails, discard another token.',
    'The door is locked to all figures except Diala.',
    'When a hero is wounded, Diala discards 1 token for each activation token that hero has.',
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
export function* temptation(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_DIALA));
  yield put(setMoveTarget(TARGET_DOOR));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_DOOR));

  yield all([
    fork(handleSpecialSetup),
    fork(handleHatredEvent),
    fork(handleDefeatVader),
    fork(handleTokensDepleted),
    fork(handleHeroesWounded),
    fork(handleStatusPhaseBegin),
    fork(handleRoundEnd),
  ]);

  track('missionStart', 'temptation');
  yield put(missionSagaLoadDone());
}
