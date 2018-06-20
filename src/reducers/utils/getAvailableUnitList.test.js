import getAvailableUnitList from './getAvailableUnitList';
import missions from '../../data/missions.json';
import units from '../../data/units.json';
import createSubgroup from './createSubgroup';

test('getAvailableUnitList exclusion list works', () => {
  const unitsForTest = {
    stormtrooper: units.stormtrooper,
    tuskenRaider: units.tuskenRaider,
  };

  const openGroups = getAvailableUnitList(
    missions.highMoon,
    unitsForTest,
    ['stormtrooper'],
    2,
    {twinShadows: true},
    {}
  );
  expect(openGroups.length).toEqual(1);
  expect(openGroups[0].id).toEqual('tuskenRaider');
});

test('getAvailableUnitList exclusion list works when unit not specified', () => {
  const unitsForTest = {
    stormtrooper: units.stormtrooper,
    tuskenRaider: units.tuskenRaider,
  };

  const openGroups = getAvailableUnitList(
    missions.highMoon,
    unitsForTest,
    [],
    2,
    {twinShadows: true},
    {}
  );
  expect(openGroups.length).toEqual(2);
});
