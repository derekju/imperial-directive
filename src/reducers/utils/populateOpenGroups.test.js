import missions from '../../data/missions.json';
import populateOpenGroups from './populateOpenGroups';
import units from '../../data/units.json';

test('populateOpenGroups will pull a Tusken Raider on a desert map', () => {
  const unitsForTest = {
    tuskenRaider: units.tuskenRaider,
  };

  const openGroups = populateOpenGroups(
    missions.highMoon,
    unitsForTest,
    2,
    {twinShadows: true},
    {},
    {}
  );
  expect(openGroups.length).toEqual(1);
  expect(openGroups[0].id).toEqual('tuskenRaider');
});

test('populateOpenGroups will not pull a Tusken Raider on a non-desert map', () => {
  const unitsForTest = {
    heavyStormtrooper: units.heavyStormtrooper,
    tuskenRaider: units.tuskenRaider,
  };
  const openGroups = populateOpenGroups(
    missions.aNewThreat,
    unitsForTest,
    2,
    {twinShadows: true},
    {},
    {}
  );
  expect(openGroups.length).toEqual(1);
  expect(openGroups[0].id).toEqual('heavyStormtrooper');
});

test('populateOpenGroups will pull expansion units when needed', () => {
  const unitsForTest = {
    tuskenRaider: units.tuskenRaider,
  };

  const openGroups = populateOpenGroups(
    missions.highMoon,
    unitsForTest,
    2,
    {twinShadows: true},
    {},
    {}
  );
  expect(openGroups.length).toEqual(1);
  expect(openGroups[0].id).toEqual('tuskenRaider');
});

test('populateOpenGroups will not pull expansion units when not specified', () => {
  const unitsForTest = {
    snowtrooper: units.snowtrooper,
    tuskenRaider: units.tuskenRaider,
  };

  const openGroups = populateOpenGroups(
    missions.highMoon,
    unitsForTest,
    6,
    {returnToHoth: false, twinShadows: false},
    {},
    {}
  );
  expect(openGroups.length).toEqual(0);
});

test('populateOpenGroups will pull gained villains when threat level is high enough', () => {
  const unitsForTest = {
    darthVader: units.darthVader,
  };

  const openGroups = populateOpenGroups(
    missions.highMoon,
    unitsForTest,
    5,
    {},
    {darthVader: true},
    {}
  );
  expect(openGroups.length).toEqual(1);
  expect(openGroups[0].id).toEqual('darthVader');
});

test('populateOpenGroups will not pull gained villain when threat level is not high enough', () => {
  const unitsForTest = {
    darthVader: units.darthVader,
  };

  const openGroups = populateOpenGroups(
    missions.highMoon,
    unitsForTest,
    2,
    {},
    {darthVader: true},
    {}
  );
  expect(openGroups.length).toEqual(0);
});

test('populateOpenGroups works with openGroupsCustom field when mission uses it', () => {
  const unitsForTest = {
    dengar: units.dengar,
    stormtrooper: units.stormtrooper,
  };

  const openGroups = populateOpenGroups(
    missions.escapeFromCloudCity,
    unitsForTest,
    5,
    {returnToHoth: true},
    {},
    {}
  );
  expect(openGroups.length).toEqual(2);
});

test('populateOpenGroups works with openGroupsCustom field when mission does not use it', () => {
  const unitsForTest = {
    dengar: units.dengar,
    stormtrooper: units.stormtrooper,
  };

  const openGroups = populateOpenGroups(
    missions.highMoon,
    unitsForTest,
    5,
    {returnToHoth: true},
    {},
    {}
  );
  expect(openGroups.length).toEqual(1);
});
