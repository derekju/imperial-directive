// @flow

import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {getAreAllHeroesWounded, getIsOneHeroLeft, WOUND_REBEL_HERO} from '../rebels';
import {
  getCurrentRound,
  increaseThreat,
  MISSION_SPECIAL_SETUP,
  missionSpecialSetupDone,
  SET_MAP_STATE_ACTIVATED,
  setAttackTarget,
  setDeploymentPoint,
  setMoveTarget,
  statusPhaseEndRoundEffectsDone,
  STATUS_PHASE_END_ROUND_EFFECTS,
} from '../mission';
import {REFER_CAMPAIGN_GUIDE, TARGET_HERO_CLOSEST_UNWOUNDED, TARGET_REMAINING} from './constants';
import {displayModal} from '../modal';
import helperDeploy from './helpers/helperDeploy';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import {missionSagaLoadDone} from '../app';
import type {StateType} from '../types';
import shuffle from 'lodash/shuffle';
import track from '../../lib/track';
import waitForModal from '../../sagas/waitForModal';

// Constants

const TARGET_TERMINAL = 'the closest active terminal';
const TARGET_LAST_TERMINAL = 'the last remaining active terminal';

const DEPLOYMENT_POINT_GREEN_MOST = 'The green deployment point closest to the most heroes';
const DEPLOYMENT_POINT_GREEN_NE = 'The north east green deployment point';
const DEPLOYMENT_POINT_GREEN_SE = 'The south east green deployment point';
const DEPLOYMENT_POINT_GREEN_SW = 'The south west green deployment point';

// Local state

let defenseProtocolOptions = ['testInsight', 'increaseThreat', 'probeDroidAttack', 'nexu'];
const tokens = shuffle(['red', 'blue', 'green']);
const activatedTokenIndexes = [];
let priorityTargetKillHero = false;

// Selectors

export const getANewThreatGoalText = (state: StateType): string[] => {
  const goals = [
    '{BOLD}Doors:{END}',
    `Health: 5, Defense: 1 {BLOCK}`,
    '{BREAK}',
    '{BOLD}Terminal Attribute Tests:{END}',
    'Red: 2 {STRENGTH}',
    'Blue: 2 {INSIGHT}',
    'Green: 2 {TECH}',
  ];

  return goals;
};

// Sagas

function* handleTerminalInteraction(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (!activatedTokenIndexes.includes(id) && type === 'terminal' && value === true) {
      // Check which color is revealed
      const color = tokens[id - 1];
      // Logic based on color
      switch (color) {
        case 'red':
          yield put(
            displayModal('RESOLVE_EVENT', {
              story: REFER_CAMPAIGN_GUIDE,
              text: ['The red terminal has been accessed!'],
              title: 'Revelation',
            })
          );
          yield call(waitForModal('RESOLVE_EVENT'));
          break;
        case 'blue':
          yield put(
            displayModal('RESOLVE_EVENT', {
              story: REFER_CAMPAIGN_GUIDE,
              text: ['The blue terminal has been accessed!'],
              title: 'Revelation',
            })
          );
          yield call(waitForModal('RESOLVE_EVENT'));
          break;
        case 'green':
          yield put(
            displayModal('RESOLVE_EVENT', {
              story: REFER_CAMPAIGN_GUIDE,
              text: ['The green terminal has been accessed!'],
              title: 'Revelation',
            })
          );
          yield call(waitForModal('RESOLVE_EVENT'));
          break;
        default:
          break;
      }
      activatedTokenIndexes.push(id);

      // Change deployment target depending on which terminals are gone
      if (activatedTokenIndexes.length === 1) {
        if (activatedTokenIndexes.includes(1)) {
          yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN_SE));
        } else {
          yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN_NE));
        }
      } else if (activatedTokenIndexes.length === 2) {
        if (!activatedTokenIndexes.includes(1)) {
          yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN_NE));
        } else if (!activatedTokenIndexes.includes(2)) {
          yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN_SE));
        } else if (!activatedTokenIndexes.includes(3)) {
          yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN_SW));
        }
      }

      // Change move target
      if (activatedTokenIndexes.length === 2) {
        if (!priorityTargetKillHero) {
          yield put(setMoveTarget(TARGET_LAST_TERMINAL));
        }
      }

      // Check victory
      if (activatedTokenIndexes.length === 3) {
        yield put(displayModal('REBEL_VICTORY'));
        track('aNewThreat', 'victory', 'terminals');
        yield call(waitForModal('REBEL_VICTORY'));
      }
    }
  }
}

function* handleDefenseProtocolsEvent(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {type, value} = action.payload;
    if (type === 'door' && value === true) {
      // Check which option is revealed
      defenseProtocolOptions = shuffle(defenseProtocolOptions);
      const option = defenseProtocolOptions.shift();
      // Logic based on option
      switch (option) {
        case 'testInsight':
          yield put(
            displayModal('RESOLVE_EVENT', {
              story:
                'Unknowingly to you, the door was trapped! Electric bolts erupt from the walls surrounding the door.',
              text: ['Each hero makes an insight test. Each hero who fails is Stunned.'],
              title: 'Defense Protocols',
            })
          );
          yield call(waitForModal('RESOLVE_EVENT'));
          break;
        case 'increaseThreat':
          yield put(
            displayModal('RESOLVE_EVENT', {
              story:
                'The door was wired into the facility security system. Your presence has alerted the Imperial troops!',
              text: ['The current threat level has been raised by 6.'],
              title: 'Defense Protocols',
            })
          );
          yield call(waitForModal('RESOLVE_EVENT'));
          yield put(increaseThreat(6));
          break;
        case 'probeDroidAttack':
          yield put(
            displayModal('RESOLVE_EVENT', {
              story:
                "The security system has alerted the Probe Droid's that are stationed around the facility.",
              text: [
                'Each Probe Droid may perform 1 move and 1 attack. Target the closest Rebel figure to each door.',
              ],
              title: 'Defense Protocols',
            })
          );
          yield call(waitForModal('RESOLVE_EVENT'));
          break;
        case 'nexu':
          yield call(
            helperDeploy,
            'The Imperial army has released their secret weapon - the fearsome Nexu.',
            [
              'Deploy a Nexu on an interior space within 3 spaces of the door that was just opened.',
            ],
            'Defense Protocols',
            ['nexu']
          );
          break;
        default:
          break;
      }
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
      track('aNewThreat', 'defeat', 'wounded');
      break;
    }
    const isOneHeroLeft = yield select(getIsOneHeroLeft);
    if (isOneHeroLeft) {
      // PRIORITY TARGET SWITCH
      priorityTargetKillHero = true;
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

    // Handle Arrival event
    if (currentRound === 5) {
      yield call(
        helperDeploy,
        REFER_CAMPAIGN_GUIDE,
        ['Deploy General Weiss to the yellow point.'],
        'Arrival',
        ['generalWeiss']
      );
    } else if (currentRound === 7) {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      track('aNewThreat', 'defeat', 'rounds');
      // We're done, don't send statusPhaseEndRoundEffects so we stall the game out on purpose
      break;
    }
    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(
    helperInitialSetup,
    '{ELITE}Elite Nexu{END}, Probe Droid (2), {ELITE}Elite Probe Droid{END}'
  );
  yield call(helperMissionBriefing, [
    'Doors are locked to Rebel figures. A Rebel figure can attack can attack a Door to open it (Health: 5, Defense: 1 {BLOCK}).',
    'A hero can activate a terminal to reveal the color. Based on the color, perform an attribute test to successfully investigate:',
    'Red: 2 {STRENGTH}',
    'Blue: 2 {INSIGHT}',
    'Green: 2 {TECH}',
  ]);
  yield put(missionSpecialSetupDone());
}

/*
Priority target definitions:
1) Initial attack is the closest unwounded hero, move is the nearest active terminal
2) If one terminal goes down, move is the same
3) If two terminals go down, move is the last one
4) At any point if heroes - 1 are wounded, attack and move are the last remaining hero
*/
export function* aNewThreat(): Generator<*, *, *> {
  // SET TARGET
  yield put(setAttackTarget(TARGET_HERO_CLOSEST_UNWOUNDED));
  yield put(setMoveTarget(TARGET_TERMINAL));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN_MOST));

  yield all([
    fork(handleSpecialSetup),
    fork(handleTerminalInteraction),
    fork(handleDefenseProtocolsEvent),
    fork(handleHeroesWounded),
    fork(handleRoundEnd),
  ]);

  track('missionStart', 'aNewThreat');
  yield put(missionSagaLoadDone());
}
