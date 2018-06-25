import getAvailableUnitList from './getAvailableUnitList';
import missions from '../../data/missions.json';
import units from '../../data/units.json';

test('getAvailableUnitList exclusion list', () => {
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

test('getAvailableUnitList exclusion with attributes', () => {
  const unitsForTest = {
    eWebEngineer: units.eWebEngineer,
    nexu: units.nexu,
    tuskenRaider: units.tuskenRaider,
  };

  const openGroups = getAvailableUnitList(
    missions.fireInTheSky,
    unitsForTest,
    [],
    5,
    {twinShadows: true},
    {}
  );

  expect(openGroups.length).toEqual(1);
});
