// @flow

import getAvailableUnitList from './getAvailableUnitList';
import type {MissionConfigType} from '../mission';
import shuffle from 'lodash/shuffle';
import type {UnitConfigType} from '../imperials';

export default (
  config: MissionConfigType,
  units: {[string]: UnitConfigType},
  missionThreat: number,
  expansions: {[string]: boolean},
  villains: {[string]: boolean}
) => {
  const unitList = getAvailableUnitList(config, units, [], missionThreat, expansions, villains);
  const shuffledGroups = shuffle(unitList);
  return shuffledGroups.slice(0, config.openGroups);
};
