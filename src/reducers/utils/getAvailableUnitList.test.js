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
    6,
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
    6,
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
    6,
    {twinShadows: true},
    {}
  );

  expect(openGroups.length).toEqual(1);
});

test('getAvailableUnitList processes threat correctly', () => {
  const unitsForTest = {
    hkAssassinDroid: units.hkAssassinDroid,
    stormtrooper: units.stormtrooper,
  };

  const openGroups = getAvailableUnitList(
    missions.highMoon,
    unitsForTest,
    [],
    2,
    {returnToHoth: true},
    {}
  );

  expect(openGroups.length).toEqual(1);
});

test('getAvailableUnitList processes expansion units correctly', () => {
  const unitsForTest = {
    hkAssassinDroid: units.hkAssassinDroid,
    tuskenRaider: units.tuskenRaider,
  };

  const openGroups = getAvailableUnitList(
    missions.highMoon,
    unitsForTest,
    [],
    6,
    {returnToHoth: true, twinShadows: true},
    {}
  );

  expect(openGroups.length).toEqual(2);
});

test('getAvailableUnitList processes expansion units when not specified', () => {
  const unitsForTest = {
    hkAssassinDroid: units.hkAssassinDroid,
    tuskenRaider: units.tuskenRaider,
  };

  const openGroups = getAvailableUnitList(missions.highMoon, unitsForTest, [], 6, {}, {});

  expect(openGroups.length).toEqual(0);
});
