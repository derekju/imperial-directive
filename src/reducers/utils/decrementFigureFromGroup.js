// @flow

import type {ImperialUnitType} from '../imperials';
import reduce from 'lodash/reduce';

export default (
  groupToDecrement: ImperialUnitType,
  groups: ImperialUnitType[],
  groupsToAddToOpen: ImperialUnitType[]
) => {
  return reduce(
    groups,
    (accumulator: ImperialUnitType[], group: ImperialUnitType) => {
      if (group.id === groupToDecrement.id && group.groupNumber === groupToDecrement.groupNumber) {
        // Don't bother pushing if it's the last one. This wipes it out.
        if (group.currentNumFigures > 1) {
          accumulator.push({
            ...group,
            currentNumFigures: group.currentNumFigures - 1,
          });
        } else {
          groupsToAddToOpen.push(group);
        }
      } else {
        accumulator.push(group);
      }
      return accumulator;
    },
    []
  );
};
