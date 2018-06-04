// @flow

import mapHasDesertTile from './mapHasDesertTile';
import type {MissionConfigType} from '../mission';
import type {UnitConfigType} from '../imperials';
import reduce from 'lodash/reduce';
import shuffle from 'lodash/shuffle';

// Pull more groups than defined to increase strength of imperial player
const EXTRA_GROUPS_TO_PULL = {
  '2': 0,
  '3': 0,
  '4': 0,
  '5': 1,
  '6': 1,
};

const THREAT_COST_FOR_MISSION_THREAT = {
  '2': 6,
  '3': 8,
  '4': 12,
  '5': 99,
  '6': 99,
};

export default (config: MissionConfigType, units: {[string]: UnitConfigType}, missionThreat: number, expansions: {[string]: boolean}) => {
  const {initialGroups, openGroups, mapImage, noMercenaryAllowed, reservedGroups} = config;

  // Check habitats
  const isDesertHabitat = mapHasDesertTile(mapImage);

  const groupsToPull = openGroups + EXTRA_GROUPS_TO_PULL[String(missionThreat)];
  const threatCost = THREAT_COST_FOR_MISSION_THREAT[String(missionThreat)];

  // Need to build a new array of units that consists of the number of times the number of
  // deployment cards that unit has. Remove from it the reserved units and the initial deployed
  // units. Those are our open groups.
  let unitList = reduce(
    units,
    (accumulator: UnitConfigType[], unit: UnitConfigType) => {
      // Don't pick special units
      if (unit.affiliation === 'mission') {
        return accumulator;
      }
      // Don't pick mercenary units if we can't for this mission
      if (noMercenaryAllowed && unit.affiliation === 'mercenary') {
        return accumulator;
      }
      // Don't pick high threat units if they exceed our soft cap
      if (unit.threat > threatCost) {
        return accumulator;
      }
      // Don't pick unique units unless the imperial player has gained them
      // TODO: Allow for inclusion of gained unique units
      if (unit.unique) {
        return accumulator;
      }
      // Don't pick units that are Desert that cannot deploy onto this map
      if (unit.habitat === 'desert' && !isDesertHabitat) {
        return accumulator;
      }
      // Don't pick units that have an expansion that is not utilized
      if (Boolean(unit.expansion) && expansions[unit.expansion] === false) {
        return accumulator;
      }

      for (let i = 0; i < unit.maxDeployed; i++) {
        accumulator.push(unit);
      }
      return accumulator;
    },
    []
  );

  // Remove reserved units from list
  for (let i = 0; i < reservedGroups.length; i++) {
    const index = unitList.findIndex((unit: UnitConfigType) => unit.id === reservedGroups[i]);
    if (index !== -1) {
      // Splice and create a new array with that one index removed
      unitList.splice(index, 1);
    }
  }

  // Remove initial units from list
  for (let i = 0; i < initialGroups.length; i++) {
    const index = unitList.findIndex((unit: UnitConfigType) => unit.id === initialGroups[i]);
    if (index !== -1) {
      // Splice and create a new array with that one index removed
      unitList.splice(index, 1);
    }
  }

  const shuffledGroups = shuffle(unitList);
  return shuffledGroups.slice(0, groupsToPull);
};
