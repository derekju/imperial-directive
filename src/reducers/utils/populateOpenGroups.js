// @flow

import type {ImperialUnitType} from '../imperials';
import pickBy from 'lodash/pickBy';
import shuffle from 'lodash/shuffle';
import units from '../../data/units';

// Pull more groups than defined to increase strength of imperial player
const EXTRA_GROUPS_TO_PULL = {
  '2': 1,
  '3': 1,
  '4': 2,
  '5': 2,
  '6': 3,
};

const THREAT_COST_FOR_MISSION_THREAT = {
  '2': 6,
  '3': 8,
  '4': 12,
  '5': 99,
  '6': 99,
};

export default (numOpenGroups: number, noMercenaryAllowed: boolean, missionThreat: number) => {
  const groupsToPull = numOpenGroups + EXTRA_GROUPS_TO_PULL[String(missionThreat)];
  const threatCost = THREAT_COST_FOR_MISSION_THREAT[String(missionThreat)];

  const groupsToPullFrom = pickBy(units, (unit: ImperialUnitType) => {
    if (noMercenaryAllowed) {
      return unit.threat <= threatCost && unit.affiliation !== 'mercenary';
    } else {
      return unit.threat <= threatCost;
    }
  });
  const shuffledGroups = shuffle(groupsToPullFrom);
  return shuffledGroups.slice(0, groupsToPull - 1);
};
