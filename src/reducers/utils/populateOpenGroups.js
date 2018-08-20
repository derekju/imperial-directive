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
  villains: {[string]: boolean},
  imperialRewards: {[string]: boolean}
): UnitConfigType[] => {
  const unitList: UnitConfigType[] = getAvailableUnitList(
    config,
    units,
    [],
    missionThreat,
    expansions,
    villains,
    imperialRewards
  );
  const shuffledGroups = shuffle(unitList);
  let slicedGroups = shuffledGroups.slice(0, config.openGroups);

  if (Array.isArray(config.openGroupsCustom)) {
    config.openGroupsCustom.forEach((unit: string) => {
      slicedGroups.push(units[unit]);
    });
  }

  return slicedGroups;
};
