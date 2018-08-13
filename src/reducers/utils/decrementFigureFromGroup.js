// @flow

import type {ImperialUnitType} from '../imperials';
import reduce from 'lodash/reduce';

// Returns the new deployed groups list
// Mutates groupsToAddToOpen!
export default (
  groupToDecrement: ImperialUnitType,
  deployedGroups: ImperialUnitType[],
  groupsToAddToOpen: ImperialUnitType[]
) => {
  return reduce(
    deployedGroups,
    (accumulator: ImperialUnitType[], group: ImperialUnitType) => {
      if (group.id === groupToDecrement.id && group.groupNumber === groupToDecrement.groupNumber) {
        // Don't bother pushing if it's the last one. This wipes it out.
        if (group.currentNumFigures > 1) {
          accumulator.push({
            ...group,
            currentNumFigures: group.currentNumFigures - 1,
          });
          // Push the group to open groups only if they are not unique
          // Unique units do not go back in
        } else if (!group.unique) {
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
