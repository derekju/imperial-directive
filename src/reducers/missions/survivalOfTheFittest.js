// @flow

import {all, call, fork, put, select, take} from 'redux-saga/effects';
import {
  DEFEAT_IMPERIAL_FIGURE,
  OPTIONAL_DEPLOYMENT_DONE,
  optionalDeployment,
  removeFromOpenGroups,
  setImperialUnitHpBuff,
} from '../imperials';
import {
  getCurrentRound,
  MISSION_SPECIAL_SETUP,
  missionSpecialSetupDone,
  SET_MAP_STATE_ACTIVATED,
  setAttackTarget,
  setDeploymentPoint,
  setMapStateInteractable,
  setMapStateVisible,
  setMoveTarget,
  STATUS_PHASE_END_ROUND_EFFECTS,
  statusPhaseEndRoundEffectsDone,
  updateImperialVictory,
  updateMapImage,
  updateRebelVictory,
} from '../mission';
import {getMissionThreat, missionSagaLoadDone} from '../app';
import {addToRoster} from '../rebels';
import createAction from '../createAction';
import {displayModal} from '../modal';
import getRandomItem from '../utils/getRandomItem';
import handleHeroesWounded from './sharedSagas/handleHeroesWounded';
import handleStatusPhaseBegin from './sharedSagas/handleStatusPhaseBegin';
import helperDeploy from './helpers/helperDeploy';
import helperEventModal from './helpers/helperEventModal';
import helperIncreaseThreat from './helpers/helperIncreaseThreat';
import helperInitialSetup from './helpers/helperInitialSetup';
import helperMissionBriefing from './helpers/helperMissionBriefing';
import missions from '../../data/missions';
import snakeCase from 'lodash/snakeCase';
import type {StateType} from '../types';
import {TARGET_CLOSEST_REBEL} from './constants';
import track from '../../lib/track';

// Constants

const MISSION_NAME = 'survivalOfTheFittest';
const MISSION_NAME_S = snakeCase(MISSION_NAME).toUpperCase();

const TARGET_SURVIVOR = 'the Survivor';

const DEPLOYMENT_POINT_GREEN_NW = 'The north west green deployment point';
const DEPLOYMENT_POINT_GREEN_NE = 'The north east green deployment point';
const DEPLOYMENT_POINT_GREEN_SW = 'The south west green deployment point';
const DEPLOYMENT_POINT_GREEN_SE = 'The south east green deployment point';

// Types

export type SurvivalOfTheFittestStateType = {
  caveRevealed: boolean,
  cavernRevealed: boolean,
  earnedDeploymentPoints: string[],
  passRevealed: boolean,
  priorityTargetKillHero: boolean,
  tile03ARevealed: boolean,
  tile07ARevealed: boolean,
  tile12ARevealed: boolean,
};

// State

const initialState = {
  caveRevealed: false,
  cavernRevealed: false,
  earnedDeploymentPoints: [],
  passRevealed: false,
  priorityTargetKillHero: false,
  tile03ARevealed: false,
  tile07ARevealed: false,
  tile12ARevealed: false,
};

export default (state: SurvivalOfTheFittestStateType = initialState, action: Object) => {
  switch (action.type) {
    case `${MISSION_NAME_S}_PRIORITY_TARGET_KILL_HERO`:
      return {
        ...state,
        priorityTargetKillHero: action.payload,
      };
    case 'SURVIVAL_OF_THE_FITTEST_CAVERN_ENTERED':
      return {
        ...state,
        cavernRevealed: true,
      };
    case 'SURVIVAL_OF_THE_FITTEST_CAVE_REVEALED':
      return {
        ...state,
        caveRevealed: true,
      };
    case 'SURVIVAL_OF_THE_FITTEST_PASS_REVEALED':
      return {
        ...state,
        passRevealed: true,
      };
    case 'SURVIVAL_OF_THE_FITTEST_TILE_03A_REVEALED':
      return {
        ...state,
        tile03ARevealed: true,
      };
    case 'SURVIVAL_OF_THE_FITTEST_TILE_12A_REVEALED':
      return {
        ...state,
        tile12ARevealed: true,
      };
    case 'SURVIVAL_OF_THE_FITTEST_TILE_07A_REVEALED':
      return {
        ...state,
        tile07ARevealed: true,
      };
    case 'SURVIVAL_OF_THE_FITTEST_SET_EARNED_DEPLOYMENT':
      return {
        ...state,
        // $FlowFixMe
        earnedDeploymentPoints: state.earnedDeploymentPoints.concat(action.payload),
      };
    default:
      return state;
  }
};

// Selectors

const getState = (state: StateType) => state[MISSION_NAME];
export const getSurvivalOfTheFittestGoalText = (state: StateType): string[] => {
  let goals = [];

  const {
    caveRevealed,
    cavernRevealed,
    passRevealed,
    tile03ARevealed,
    tile07ARevealed,
    tile12ARevealed,
  } = state.survivalOfTheFittest;

  if (!cavernRevealed) {
    goals = goals.concat(['{BOLD}Current Goal:{END}', 'Reveal the Cavern', '{BREAK}']);
  } else {
    goals = goals.concat([
      '{BOLD}Survivor (Rebel token):{END}',
      'After the {ELITE}Wampa{END} is defeated, a healthy Rebel figure can interact (3 {STRENGTH} or {INSIGHT}) to revive him.',
      '{BREAK}',
    ]);
  }

  goals = goals.concat([
    '{BOLD}Obscured Tiles:{END}',
    'When a Rebel unit would be adjacent to a undiscovered tile, click the button to reveal the appropriate tile.',
    '{BREAK}',
  ]);

  // Goals for moving south from the eastern side of the map
  if (!caveRevealed) {
    goals = goals.concat(['South of Tile 09A:', '---PLACEHOLDER_SOUTH_OF_TILE09A---', '{BREAK}']);
  } else if (caveRevealed && !cavernRevealed) {
    goals = goals.concat([
      'West of Cave (Tile 01A):',
      '---PLACEHOLDER_WEST_OF_TILE01A---',
      '{BREAK}',
    ]);
  }

  // Goals for moving south from the western side of the map
  if (!tile03ARevealed) {
    goals = goals.concat(['South of Tile 17A:', '---PLACEHOLDER_SOUTH_OF_TILE17A---', '{BREAK}']);
  } else if (tile03ARevealed && !passRevealed) {
    goals = goals.concat(['South of Tile 03A:', '---PLACEHOLDER_SOUTH_OF_TILE03A---', '{BREAK}']);
  } else if (passRevealed && !tile12ARevealed) {
    goals = goals.concat([
      'South of Pass (Tile 04A):',
      '---PLACEHOLDER_SOUTH_OF_TILE04A---',
      '{BREAK}',
    ]);
  } else if (tile12ARevealed && !tile07ARevealed) {
    goals = goals.concat(['East of Tile 12A):', '---PLACEHOLDER_EAST_OF_TILE12A---', '{BREAK}']);
  } else if (tile07ARevealed && !cavernRevealed) {
    goals = goals.concat(['North of Tile 07A):', '---PLACEHOLDER_NORTH_OF_TILE07A---', '{BREAK}']);
  }

  return goals;
};

// Sagas

function* setRandomDeploymentPoint(): Generator<*, *, *> {
  const {earnedDeploymentPoints} = yield select(getState);
  yield put(setDeploymentPoint(getRandomItem(...earnedDeploymentPoints)));
}

function* handleRevealSouthOfTile17A(): Generator<*, *, *> {
  yield take('SURVIVAL_OF_THE_FITTEST_REVEAL_SOUTH_OF_TILE_17A');
  yield put(
    updateMapImage([
      [3, 0, ['h03a', 'h03a', 'h03a', 'h03a', 'h03a']],
      [4, 0, ['h03a', 'h03a', 'h03a', 'h03a', 'h03a']],
      [5, 0, ['h03a', 'h03a', 'h03a', 'h03a', 'h03a']],
      [6, 0, ['h03a', 'h03a', 'h03a', 'h03a', 'h03a']],
    ])
  );
  yield put(createAction('SURVIVAL_OF_THE_FITTEST_TILE_03A_REVEALED'));

  yield call(helperEventModal, {
    text: ['Tile 03A has been revealed.'],
    title: 'Survival of the Fittest',
  });
}

function* handleRevealSouthOfTile04A(): Generator<*, *, *> {
  yield take('SURVIVAL_OF_THE_FITTEST_REVEAL_SOUTH_OF_TILE_04A');
  yield put(
    updateMapImage([
      [11, 1, ['h12a', 'h12a', 'h12a']],
      [12, 1, ['h12a', 'h12a', 'h12a']],
      [13, 1, ['h12a', 'h12a', 'h12a']],
    ])
  );
  yield put(createAction('SURVIVAL_OF_THE_FITTEST_TILE_12A_REVEALED'));

  yield call(helperEventModal, {
    text: ['Tile 12A has been revealed.'],
    title: 'Survival of the Fittest',
  });
}

function* handleRevealEastOfTile12A(): Generator<*, *, *> {
  yield take('SURVIVAL_OF_THE_FITTEST_TILE_07A_REVEALED');
  yield put(
    updateMapImage([
      [10, 5, ['h07a', 'h07a', 'h07a']],
      [11, 4, ['h07a', 'h07a', 'h07a', 'h07a']],
      [12, 4, ['h07a', 'h07a', 'h07a', 'h07a']],
      [13, 4, ['h07a', 'h07a', 'h07a']],
    ])
  );
  yield put(createAction('SURVIVAL_OF_THE_FITTEST_TILE_07A_REVEALED'));

  yield call(helperEventModal, {
    text: ['Tile 07A has been revealed.'],
    title: 'Survival of the Fittest',
  });
}

function* handleImperialSurge(): Generator<*, *, *> {
  track(MISSION_NAME, 'imperialSurge', 'triggered');
  yield call(helperEventModal, {
    text: ['The threat has been increased by the threat level.'],
    title: 'Imperial Surge',
  });
  yield call(helperIncreaseThreat, 1);
}

function* handleThePass(): Generator<*, *, *> {
  track(MISSION_NAME, 'thePass', 'triggered');

  yield take('SURVIVAL_OF_THE_FITTEST_PASS_REVEALED');

  yield put(
    updateMapImage([
      [7, 0, ['h04a', 'h04a', 'h04a', 'h04a']],
      [8, 0, ['h04a', 'h04a', 'h04a', 'h04a']],
      [9, 0, ['h04a', 'h04a', 'h04a', 'h04a']],
      [10, 0, ['h04a', 'h04a', 'h04a', 'h04a']],
    ])
  );

  yield put(
    createAction('SURVIVAL_OF_THE_FITTEST_SET_EARNED_DEPLOYMENT', DEPLOYMENT_POINT_GREEN_SW)
  );

  yield call(
    helperDeploy,
    'The Pass',
    '',
    ['The Pass (tile 04A) has been revealed', 'A Snowtrooper group will now be deployed.'],
    [
      'snowtrooper',
      'Deploy to the Pass (tile 04A), closest to the Rebel unit that revealed the Pass.',
    ]
  );
}

function* handleTheCave(): Generator<*, *, *> {
  track(MISSION_NAME, 'theCave', 'triggered');

  yield take('SURVIVAL_OF_THE_FITTEST_CAVE_REVEALED');

  yield put(
    updateMapImage([
      [4, 12, ['h01a', 'h01a', 'h01a', 'h01a', 'c00a']],
      [5, 12, ['h01a', 'h01a', 'h01a', 'h01a', 'c00a']],
      [6, 12, ['h01a', 'h01a', 'h01a', 'h01a', 'h20a']],
      [7, 12, ['h01a', 'h01a', 'h01a', 'h01a', 'h20a']],
      [8, 12, ['h01a', 'h01a', 'h01a', 'h01a', 'c00a']],
      [9, 12, ['h01a', 'h01a', 'h01a', 'h01a', 'c00a']],
      [10, 12, ['c00a', 'h20a', 'h20a', 'c00a', 'c00a']],
    ])
  );

  yield put(
    createAction('SURVIVAL_OF_THE_FITTEST_SET_EARNED_DEPLOYMENT', DEPLOYMENT_POINT_GREEN_SE)
  );

  yield call(
    helperDeploy,
    'The Cave',
    '',
    [
      'The Cave (Tile 01A) has been revealed.',
      'An {ELITE}Elite Probe Droid{END} will now be deployed.',
    ],
    [
      'probeDroidElite',
      'Deploy to the Cave (tile 02A), closest to the Rebel unit that revealed the Cave.',
    ]
  );
}

function* handleRescueTheFallen(): Generator<*, *, *> {
  track(MISSION_NAME, 'rescueTheFallen', 'triggered');

  const missionThreat = yield select(getMissionThreat);

  yield take('SURVIVAL_OF_THE_FITTEST_CAVERN_REVEALED');

  yield put(createAction('SURVIVAL_OF_THE_FITTEST_CAVERN_ENTERED'));
  yield put(
    updateMapImage([
      [5, 7, ['h02a', 'h02a', 'h02a', 'h20a', 'h20a']],
      [6, 6, ['h02a', 'h02a', 'h02a', 'h02a', 'h02a', 'h02a']],
      [7, 6, ['h02a', 'h02a', 'h02a', 'h02a', 'h02a', 'h02a']],
      [8, 6, ['h02a', 'h02a', 'h02a', 'h02a', 'h02a', 'h02a']],
      [9, 6, ['h02a', 'h02a', 'h02a', 'h02a', 'h02a', 'h02a']],
      [10, 8, ['h02a', 'h02a', 'h02a']],
    ])
  );

  yield call(
    helperDeploy,
    'Rescue the Fallen',
    '',
    [
      'The Cavern (Tile 02A) has been revealed.',
      'An {ELITE}Elite Wampa{END} and a Probe Droid will now be deployed.',
      'The Rebel mission token is the survivor. After the {ELITE}Wampa{END} is defeated, a healthy Rebel figure can interact with the survivor (3 {STRENGTH} or {INSIGHT}) to revive him.',
      'The mission no longer ends at the end of Round 4.',
    ],
    ['wampaElite', `Deploy to the red point. The Wampa gains ${missionThreat} extra Health.`],
    ['probeDroid', 'Deploy to the yellow point.']
  );

  yield put(setImperialUnitHpBuff('wampaElite', missionThreat));
  yield put(updateRebelVictory('When the survivor is revived'));
  yield put(
    updateImperialVictory('When all heroes are wounded and the Echo Base Troopers are defeated')
  );
  yield put(setMapStateVisible(1, 'rebel', true));
  yield put(setMoveTarget(TARGET_SURVIVOR));
}

function* handleEliteWampaDefeated(): Generator<*, *, *> {
  while (true) {
    const action = yield take(DEFEAT_IMPERIAL_FIGURE);
    const {group} = action.payload;
    if (group.id === 'wampaElite') {
      yield put(removeFromOpenGroups('wampaElite'));
      yield put(setMapStateInteractable(1, 'rebel', true));

      yield call(helperEventModal, {
        text: ['The survivor is now interactable.'],
        title: 'Survival of the Fittest',
      });

      // We're done
      break;
    }
  }
}

function* handleSurvivorRevived(): Generator<*, *, *> {
  while (true) {
    const action = yield take(SET_MAP_STATE_ACTIVATED);
    const {id, type, value} = action.payload;
    if (id === 1 && type === 'rebel' && value === true) {
      yield put(displayModal('REBEL_VICTORY'));
      track(MISSION_NAME, 'victory', 'survivor');
      // We're done
      break;
    }
  }
}

// REQUIRED SAGA
function* handleRoundEnd(): Generator<*, *, *> {
  while (true) {
    yield take(STATUS_PHASE_END_ROUND_EFFECTS);
    const currentRound = yield select(getCurrentRound);
    const {cavernRevealed} = yield select(getState);

    if (currentRound === 2 || currentRound === 3) {
      yield call(handleImperialSurge);
      // Only allow round end if cavern has not been revealed
    } else if (!cavernRevealed && currentRound === 4) {
      // End game with imperial victory
      yield put(displayModal('IMPERIAL_VICTORY'));
      track(MISSION_NAME, 'defeat', 'round');
      break;
    }

    yield call(setRandomDeploymentPoint);
    yield put(statusPhaseEndRoundEffectsDone());
  }
}

// REQUIRED SAGA
function* handleSpecialSetup(): Generator<*, *, *> {
  yield take(MISSION_SPECIAL_SETUP);
  yield call(helperInitialSetup, missions[MISSION_NAME].initialGroups);
  yield call(helperEventModal, {
    text: [
      'When constructing the map, only construct the Visible Area (shaded red). This has been reflected in the in-game map.',
      'The heroes control the Echo Base Troopers as an ally at no additional cost.',
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

  // Deploy Echo Base Troopers
  yield put(addToRoster('echoBaseTrooper'));

  yield call(helperMissionBriefing, [
    'Tiles not yet placed on the map are obscured tiles. When a Rebel figure enters a space is adjacent to an obscured tile, place that tile and any tokens on the map.',
    'Deploy all Rebel units to the blue points, divided between the two as evenly as possible.',
  ]);

  yield put(missionSpecialSetupDone());
}

export function* survivalOfTheFittest(): Generator<*, *, *> {
  // SET TARGETS
  yield put(setAttackTarget(TARGET_CLOSEST_REBEL));
  yield put(setMoveTarget(TARGET_CLOSEST_REBEL));
  // SET INITIAL DEPLOYMENT POINT
  yield put(
    createAction('SURVIVAL_OF_THE_FITTEST_SET_EARNED_DEPLOYMENT', DEPLOYMENT_POINT_GREEN_NW)
  );
  yield put(
    createAction('SURVIVAL_OF_THE_FITTEST_SET_EARNED_DEPLOYMENT', DEPLOYMENT_POINT_GREEN_NE)
  );
  yield call(setRandomDeploymentPoint);

  yield all([
    fork(handleSpecialSetup),
    fork(handleRevealSouthOfTile17A),
    fork(handleRevealSouthOfTile04A),
    fork(handleRevealEastOfTile12A),
    fork(handleThePass),
    fork(handleTheCave),
    fork(handleRescueTheFallen),
    fork(handleSurvivorRevived),
    fork(handleEliteWampaDefeated),
    fork(
      handleHeroesWounded(
        MISSION_NAME,
        `${MISSION_NAME_S}_PRIORITY_TARGET_KILL_HERO`,
        'echoBaseTrooper'
      )
    ),
    fork(handleStatusPhaseBegin),
    fork(handleRoundEnd),
  ]);

  track('missionStart', MISSION_NAME);
  yield put(missionSagaLoadDone());
}
