// @flow

import {
  addToRoster,
  getAreAllHeroesWounded,
  SET_REBEL_ESCAPED,
  WOUND_REBEL_HERO,
  WOUND_REBEL_OTHER,
} from '../rebels';
import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {
  getCurrentRound,
  increaseThreat,
  MISSION_SPECIAL_SETUP,
  missionSpecialSetupDone,
  SET_MAP_STATE_ACTIVATED,
  setAttackTarget,
  setDeploymentPoint,
  setMapStateActivated,
  setMapStateVisible,
  setMoveTarget,
  statusPhaseEndRoundEffectsDone,
  STATUS_PHASE_END_ROUND_EFFECTS,
  updateImperialVictory,
  updateRebelVictory,
} from '../mission';
import {REFER_CAMPAIGN_GUIDE} from './constants';
import createAction from '../createAction';
import {displayModal} from '../modal';
import helperDeploy from './helpers/helperDeploy';
import helperEventModal from './helpers/helperEventModal';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import {missionSagaLoadDone} from '../app';
import type {StateType} from '../types';
import track from '../../lib/track';

// Constants

const TARGET_CELL_DOOR = 'the Cell door or terminal (whichever closest)';
const TARGET_CAPTIVE = 'the Captive';
const TARGET_ENTRANCE = 'the Entrance';

const DEPLOYMENT_POINT_GREEN_SE = 'The south east green deployment point';

// Types

export type ImperialHospitalityStateType = {
  terminalDestroyed: boolean,
  thePrisonerResolved: boolean,
  wellGuardedResolved: boolean,
};

// State

const initialState = {
  terminalDestroyed: false,
  thePrisonerResolved: false,
  wellGuardedResolved: false,
};

export default (state: ImperialHospitalityStateType = initialState, action: Object) => {
  switch (action.type) {
    case 'IMPERIAL_HOSPITALITY_PRISONER_RESOLVED':
      return {
        ...state,
        thePrisonerResolved: true,
      };
    case 'IMPERIAL_HOSPITALITY_WELL_GUARDED_RESOLVED':
      return {
        ...state,
        wellGuardedResolved: true,
      };
    case 'IMPERIAL_HOSPITALITY_TERMINAL_DESTROYED':
      return {
        ...state,
        terminalDestroyed: true,
      };
    default:
      return state;
  }
};

// Selectors

const getState = (state: StateType) => state.imperialHospitality;
export const getImperialHospitalityGoalText = (state: StateType): string[] => {
  let goals = [];

  if (!state.imperialHospitality.thePrisonerResolved) {
    goals = goals.concat(['{BOLD}Current Goal:{END}', 'Open the door to the Cell.', '{BREAK}']);
  }

  goals = goals.concat([
    '{BOLD}Doors:{END}',
    'Health: 6, Defense: 1 black die, Interact: 2 {TECH}',
    '{BREAK}',
    '{BOLD}Terminal:{END}',
    'Health: 6, Defense: 1 black die, Interact: 2 {TECH}',
    'The terminal will transmit at the end of Round 4',
  ]);

  if (state.imperialHospitality.thePrisonerResolved) {
    goals.push('{BREAK}');
    goals.push('{BOLD}Captive:{END}');
    goals.push('Health: 8, Speed: 2, Defense: 1 white die');
    goals.push(
      'An adjacent hero can suffer 1 {STRAIN} to take an attack targeted towards the Captive.'
    );
  }

  return goals;
};

// Sagas

function* handleWellGuardedEvent(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if ([1, 2].includes(id) && type === 'door' && value === true) {
      track('imperialHospitality', 'wellGuarded', 'triggered');
      yield call(
        helperDeploy,
        REFER_CAMPAIGN_GUIDE,
        [
          'Deploy an Imperial Officer and Trandoshan Hunter group to the Data Center.',
          'Deploy them on or adjacent to the terminal.',
        ],
        'Well-Guarded',
        ['imperialOfficer', 'trandoshanHunter']
      );
      yield put(createAction('IMPERIAL_HOSPITALITY_WELL_GUARDED_RESOLVED', true));
      break;
    }
  }
}

function* handleTransmissionReceivedEvent(): Generator<*, *, *> {
  const state = yield select(getState);
  const {terminalDestroyed, thePrisonerResolved, wellGuardedResolved} = state;
  if (!terminalDestroyed) {
    track('imperialHospitality', 'transmissionReceived', 'triggered');
    yield call(helperEventModal, {
      story: REFER_CAMPAIGN_GUIDE,
      text: [
        'The transmission has been sent!',
        'All doors are now open and the terminal is now disabled.',
      ],
      title: 'Transmission Received',
    });

    // Open all doors
    if (!wellGuardedResolved) {
      yield put(setMapStateActivated(1, 'door', true));
      yield put(setMapStateActivated(2, 'door', true));
      yield take('IMPERIAL_HOSPITALITY_WELL_GUARDED_RESOLVED');
    }
    if (!thePrisonerResolved) {
      yield put(setMapStateActivated(3, 'door', true));
      yield take('IMPERIAL_HOSPITALITY_PRISONER_RESOLVED');
    }
    // Discard terminal
    yield put(setMapStateVisible(1, 'terminal', false));
  }
}

function* handleTheDataEvent(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'terminal' && value === true) {
      track('imperialHospitality', 'theData', 'triggered');
      yield call(helperEventModal, {
        story: REFER_CAMPAIGN_GUIDE,
        text: ['The threat has been increased by 3.'],
        title: 'The Data',
      });
      yield put(increaseThreat(3));
      yield put(setMapStateVisible(1, 'terminal', false));
      yield put(createAction('IMPERIAL_HOSPITALITY_TERMINAL_DESTROYED', true));
      // We're done
      break;
    }
  }
}

function* handlePrisonerEvent(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 3 && type === 'door' && value === true) {
      track('imperialHospitality', 'prisoner', 'triggered');
      yield call(helperEventModal, {
        story: REFER_CAMPAIGN_GUIDE,
        text: [
          'The token is now a Rebel figure that has Health: 8, Speed: 2, Defense: 1 white die.',
          'When the captive is targeted, an adjacent hero may take 1 {STRAIN} to be the target of that attack instead.',
          'The captive suffers Bleeding.',
        ],
        title: 'The Prisoner',
      });
      yield call(helperEventModal, {
        text: [
          'The Rebels win if the captive escapes!',
          'The Rebels lose if the captive is wounded or all heroes are wounded.',
        ],
        title: 'The Prisoner',
      });
      yield put(setMapStateVisible(1, 'rebel', false));
      yield put(addToRoster('missionImperialHospitalityCaptive'));
      yield put(updateRebelVictory('The captive escapes through the entrance'));
      yield put(updateImperialVictory('When the captive is wounded or all heroes are wounded'));
      yield put(createAction('IMPERIAL_HOSPITALITY_PRISONER_RESOLVED', true));
      // SWITCH TARGETS
      yield put(setAttackTarget(TARGET_CAPTIVE));
      yield put(setMoveTarget(TARGET_ENTRANCE));
      // We're done
      break;
    }
  }
}

function* handleCaptiveKilled(): Generator<*, *, *> {
  while (true) {
    const action = yield take(WOUND_REBEL_OTHER);
    const {id} = action.payload;
    if (id === 'missionImperialHospitalityCaptive') {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      track('imperialHospitality', 'defeat', 'captiveKilled');
      // We're done
      break;
    }
  }
}

function* handleCaptiveEscaped(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_REBEL_ESCAPED);
    const {id} = action.payload;
    if (id === 'missionImperialHospitalityCaptive') {
      yield put(displayModal('REBEL_VICTORY'));
      track('imperialHospitality', 'victory', 'captiveEscaped');
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
      track('imperialHospitality', 'defeat', 'wounded');
      break;
    }
  }
}

// REQUIRED SAGA
function* handleRoundEnd(): Generator<*, *, *> {
  while (true) {
    yield take(STATUS_PHASE_END_ROUND_EFFECTS);
    const currentRound = yield select(getCurrentRound);

    if (currentRound === 4) {
      yield call(handleTransmissionReceivedEvent);
    }

    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(helperInitialSetup, 'Probe Droid (2), Royal Guard');
  yield call(helperMissionBriefing, [
    'Doors are locked. A Rebel figure can attack a door to destroy it (Health: 6, Defense: 1 black die) or interact (2 {TECH}) to open it.',
    'The terminal will transmit sensitive data at the end of Round 4. A Rebel figure can attack it (Health: 6, Defense: 1 black die) or interact (2 {TECH}) to destroy it.',
    'The mission token represents the captive.',
    'Your current goal is to open the door to the Cell.',
  ]);
  yield put(missionSpecialSetupDone());
}

/*
Priority target definitions:
1) Initial attack is default, move is cell door
2) Once cell door opens, attack is the captive, move is the entrance
*/
export function* imperialHospitality(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setMoveTarget(TARGET_CELL_DOOR));
  // SET INITIAL DEPLOYMENT POINT
  yield put(setDeploymentPoint(DEPLOYMENT_POINT_GREEN_SE));

  yield all([
    fork(handleSpecialSetup),
    fork(handleWellGuardedEvent),
    fork(handleTheDataEvent),
    fork(handlePrisonerEvent),
    fork(handleCaptiveKilled),
    fork(handleCaptiveEscaped),
    fork(handleHeroesWounded),
    fork(handleRoundEnd),
  ]);

  track('missionStart', 'imperialHospitality');
  yield put(missionSagaLoadDone());
}
