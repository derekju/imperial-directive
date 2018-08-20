import {createNewGroup} from '../imperials';
import decrementFigureFromGroup from './decrementFigureFromGroup';

test('decrementFigureFromGroup decrements a single unit if there are multiple', () => {
  const group = createNewGroup('stormtrooper', {}, 5, 'normal', 'red', 1, {});
  const open = [];
  const newDeployed = decrementFigureFromGroup(group, [group], open);
  expect(newDeployed[0].currentNumFigures).toEqual(2);
  expect(open.length).toEqual(0);
});

test('decrementFigureFromGroup adds to open groups if is a single unit', () => {
  const group = createNewGroup('probeDroid', {}, 5, 'normal', 'red', 1, {});
  const open = [];
  const newDeployed = decrementFigureFromGroup(group, [group], open);
  expect(newDeployed.length).toEqual(0);
  expect(open.length).toEqual(1);
});

test('decrementFigureFromGroup will add a multiple unit to open groups if there are no more', () => {
  const group = createNewGroup('stormtrooper', {}, 5, 'normal', 'red', 1, {});
  group.currentNumFigures = 1;
  const open = [];
  const newDeployed = decrementFigureFromGroup(group, [group], open);
  expect(newDeployed.length).toEqual(0);
  expect(open.length).toEqual(1);
});

test('decrementFigureFromGroup does not add unique units back into open groups', () => {
  const group = createNewGroup('bobaFett', {}, 5, 'normal', 'red', 1, {});
  const open = [];
  const newDeployed = decrementFigureFromGroup(group, [group], open);
  expect(newDeployed.length).toEqual(0);
  expect(open.length).toEqual(0);
});
