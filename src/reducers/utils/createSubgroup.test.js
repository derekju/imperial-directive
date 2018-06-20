import createSubgroup from './createSubgroup';
import units from '../../data/units.json';

const testUnits = [units.atst, units.probeDroid, units.stormtrooper];

test('createSubgroup works with no filters', () => {
  const subgroup = createSubgroup(testUnits, 10);
  expect(subgroup.length).toEqual(2);
});

test('createSubgroup works with no filters but threat only probeDroid', () => {
  const subgroup = createSubgroup(testUnits, 3);
  expect(subgroup.length).toEqual(1);
});

test('createSubgroup works with sample filter', () => {
  const subgroup = createSubgroup(testUnits, 10, value => !value.attributes.includes('vehicle'));
  expect(subgroup.length).toEqual(2);
});

test('createSubgroup works with multiple filters', () => {
  const subgroup = createSubgroup(
    testUnits,
    10,
    value => !value.attributes.includes('vehicle'),
    value => value.id === 'stormtrooper'
  );
  expect(subgroup.length).toEqual(1);
});
