// @flow

import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {getAreAllHeroesWounded, getIsOneHeroLeft, WOUND_REBEL_HERO} from '../rebels';
import {
  getCurrentRound,
  getMapStates,
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
import {displayModal} from '../modal';
import {deployNewGroups, getCurrentGroups, setInterruptedGroup} from '../imperials';
import {getMissionThreat} from '../app';
import last from 'lodash/last';
import {shuffle} from 'lodash';
import waitForModal from '../../sagas/waitForModal';

// Constants

const TARGET_MOST_WOUNDED = 'the most damaged hero';
const TARGET_ENTRANCE_TOKEN = 'the entrance token';

const DEPLOYMENT_POINT_BOTTOM_RIGHT = 'The bottom right green deployment point';

// Local state

const neturalTokens = shuffle(['red', 'blue', 'green', 'yellow']);
const activatedTokenIndexes = [];
let escapedRebelTroopers = 0;
let requireEndRoundEffects = false;
let priorityTargetKillHero = false;

// Sagas

// function* handleLockDownEvent(): Generator<*, *, *> {
//   while (true) {
//     const action = yield take(SET_MAP_STATE_ACTIVATED);
//     const {id, type, value} = action.payload;
//     if (id === 1 && type === 'door' && value === true) {
//       requireEndRoundEffects = true;
//       // Ok, this is the round the rebels opened the door so wait until end of round to trigger
//       yield take(STATUS_PHASE_END_ROUND_EFFECTS);
//       // Pick which one we'll do and then do it
//       yield put(displayModal('AFTERMATH_LOCKDOWN'));
//       yield call(waitForModal('AFTERMATH_LOCKDOWN'));
//       yield put(setDeploymentPoint(DEPLOYMENT_POINT_RED));
//       // We're done
//       requireEndRoundEffects = false;
//       yield put(statusPhaseEndRoundEffectsDone());
//       break;
//     }
//   }
// }

// function* handleFortifiedEvent(): Generator<*, *, *> {
//   while (true) {
//     const action = yield take(SET_MAP_STATE_ACTIVATED);
//     const {id, type, value} = action.payload;
//     if (id === 1 && type === 'door' && value === true) {
//       // Display a modal saying we're going to reinforce
//       yield put(
//         displayModal('RESOLVE_EVENT', {
//           eventName: 'Fortified',
//           text:
//             'The E-Web Engineer should be deployed to the Yellow deployment point in the Atrium',
//         })
//       );
//       yield call(waitForModal('RESOLVE_EVENT'));
//       // Do the deployment from reserved groups
//       yield put(deployNewGroups(['eWebEngineer', 'stormtrooper', 'imperialOfficer']));
//       // PRIORITY TARGET SWITCH #2
//       if (!priorityTargetKillHero) {
//         yield put(setPriorityTarget(PRIORITY_TARGET_TERMINAL_2));
//       }
//       // We're done
//       break;
//     }
//   }
// }

function* handleMissionTokenReveal(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (!activatedTokenIndexes.includes(id) && type === 'neutral' && value === true) {
      // Check which color is revealed
      const color = neturalTokens[id - 1];
      // Logic based on color
      switch (color) {
        case 'red':
          // Deploy a rebel trooper where the map state was
          // Show modal that hero within 3 spaces recovers 5 damage
          // Change priority target?
          // Do the deployment from reserved groups
          yield put(deployNewGroups(['stormtrooper']));
          break;
        case 'blue':
          // Deploy a rebel trooper where the map state was
          // Show modal that the trooper is focused and that they can perform an immediate attack
          // Increase threat level
          const missionThreat = yield select(getMissionThreat);
          yield put(increaseThreat(missionThreat));
          break;
        case 'green':
          // Show modal that active hero can move or attack
          yield put(
            displayModal('RESOLVE_EVENT', {
              text: [
                `Replace neutral token ${id} with a Rebel trooper.`,
                'The active hero, if any, may interrupt to perform a move or attack.',
              ],
            })
          );
          yield call(waitForModal('RESOLVE_EVENT'));

          // Do the deployment from reserved groups
          yield put(deployNewGroups(['probeDroid']));
          yield put(
            displayModal('RESOLVE_EVENT', {
              text: [`Deploy a Probe Droid to the bottom green deployment point.`],
            })
          );
          yield call(waitForModal('RESOLVE_EVENT'));

          // Change the priority target
          yield put(setMoveTarget(TARGET_ENTRANCE_TOKEN));
          break;
        case 'yellow':
          // Do the deployment from reserved groups
          yield put(deployNewGroups(['imperialOfficerElite']));
          // Show modal that the elite imperial officer can immediately move and attack
          yield put(
            displayModal('RESOLVE_EVENT', {
              text: [
                `Replace neutral token ${id} with an elite Imperial Officer.`,
                'The elite Imperial Officer may immediately perform 1 move and 1 attack.',
              ],
            })
          );
          yield call(waitForModal('RESOLVE_EVENT'));
          // Do the activation
          const allGroups = yield select(getCurrentGroups);
          const {deployedGroups} = allGroups;
          yield put(setInterruptedGroup(last(deployedGroups)));
          break;
        default:
          break;
      }
      activatedTokenIndexes.push(id);
    }
  }
}

// function* handleTerminalsDestroyed(): Generator<*, *, *> {
//   while (true) {
//     yield take(SET_MAP_STATE_ACTIVATED);
//     const mapStates = yield select(getMapStates);
//     // Now check all 4 terminals, if they are activated, then game over for rebels
//     if (
//       mapStates['terminal-1'].activated &&
//       mapStates['terminal-2'].activated &&
//       mapStates['terminal-3'].activated &&
//       mapStates['terminal-4'].activated
//     ) {
//       yield put(displayModal('REBEL_VICTORY'));
//       // We're done
//       break;
//     }
//   }
// }

function* handleHeroesWounded(): Generator<*, *, *> {
  while (true) {
    yield take(WOUND_REBEL_HERO);
    const allWounded = yield select(getAreAllHeroesWounded);
    if (allWounded) {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      break;
    }
    const isOneHeroLeft = yield select(getIsOneHeroLeft);
    if (isOneHeroLeft) {
      // PRIORITY TARGET SWITCH
      priorityTargetKillHero = true;
      yield put(setAttackTarget(TARGET_MOST_WOUNDED));
      yield put(setMoveTarget(TARGET_MOST_WOUNDED));
    }
  }
}

// REQUIRED SAGA
function* handleRoundEnd(): Generator<*, *, *> {
  while (true) {
    yield take(STATUS_PHASE_END_ROUND_EFFECTS);
    const currentRound = yield select(getCurrentRound);

    if (currentRound === 4) {
      // Reveal 1 mission token at random, show modal saying they have damage and are stunned
    }

    if (!requireEndRoundEffects) {
      yield put(statusPhaseEndRoundEffectsDone());
    }
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  // Double current threat
  const missionThreat = yield select(getMissionThreat);
  yield put(increaseThreat(missionThreat * 2));
  // Do optional deployment from open groups which doesn't work right now...
  yield put(missionSpecialSetupDone());
}

/*
Priority target definitions:
1) Initial is door
2) Once door opens, target is terminal 2
3) If terminal 2 is down, target is nearest terminal
4) At any point if heroes - 1 are wounded, target is the last remaining hero
*/

export function* friendsOfOld(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setMoveTarget(TARGET_MOST_WOUNDED));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_BOTTOM_RIGHT));

  yield all([
    fork(handleSpecialSetup),
    fork(handleMissionTokenReveal),
    // fork(handleFortifiedEvent),
    // fork(handleSingleTerminalDestroyed),
    // fork(handleTerminalsDestroyed),
    fork(handleHeroesWounded),
    fork(handleRoundEnd),
  ]);
}
