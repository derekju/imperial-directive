import populateOpenGroups from './populateOpenGroups';
import missions from '../../data/missions.json';
import units from '../../data/units.json';

test('populateOpenGroups will pull a Tusken Raider on a desert map', () => {
  const unitsForTest = {
    tuskenRaider: units.tuskenRaider,
  };

  const openGroups = populateOpenGroups(missions.highMoon, unitsForTest, 2, {twinShadows: true});
  expect(openGroups.length).toEqual(1);
  expect(openGroups[0].id).toEqual('tuskenRaider');
});

test('populateOpenGroups will not pull a Tusken Raider on a non-desert map', () => {
  const unitsForTest = {
    heavyStormtrooper: units.heavyStormtrooper,
    tuskenRaider: units.tuskenRaider,
  };
  const openGroups = populateOpenGroups(missions.aNewThreat, unitsForTest, 2, {twinShadows: true});
  expect(openGroups.length).toEqual(1);
  expect(openGroups[0].id).toEqual('heavyStormtrooper');
});

test('populateOpenGroups will pull expansion units when needed', () => {
  const unitsForTest = {
    tuskenRaider: units.tuskenRaider,
  };

  const openGroups = populateOpenGroups(missions.highMoon, unitsForTest, 2, {twinShadows: true});
  expect(openGroups.length).toEqual(1);
  expect(openGroups[0].id).toEqual('tuskenRaider');
});

test('populateOpenGroups will not pull expansion units when not specified', () => {
  const unitsForTest = {
    tuskenRaider: units.tuskenRaider,
  };

  const openGroups = populateOpenGroups(missions.highMoon, unitsForTest, 2, {twinShadows: false});
  expect(openGroups.length).toEqual(0);
});
