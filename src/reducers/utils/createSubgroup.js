// @flow

import filter from 'lodash/filter';
import shuffle from 'lodash/shuffle';
import type {UnitConfigType} from '../imperials';

// Creates a subgroup of units that can be used to deploy
// Allows for filters to restrict which units can be selected
export default (
  units: UnitConfigType[],
  threatLimit: number,
  ...filters: Function[]
): UnitConfigType[] => {
  let filteredResult = units.slice();

  // Run through each filter
  filters.forEach(f => {
    filteredResult = filter(filteredResult, f);
  });

  // Pick out which ones we want until we hit the threat limit
  const finalResults = [];
  let currentThreat = 0;

  // Loop through all remaining units and pull one unit randomly at a time
  // Add it to our results if the threat cost is less than the max
  // If it's greater we just throw the unit away to simplify the logic
  while (currentThreat < threatLimit && filteredResult.length > 0) {
    filteredResult = shuffle(filteredResult);
    const randomElement = filteredResult.shift();
    if (randomElement.threat + currentThreat <= threatLimit) {
      finalResults.push(randomElement);
      currentThreat += randomElement.threat;
    }
  }

  return finalResults;
};
