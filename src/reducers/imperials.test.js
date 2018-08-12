import reducer, {createNewGroup, initialState, removeFromOpenGroups} from './imperials';

test('test removeFromOpenGroups', () => {
  const testState = {
    ...initialState,
    openGroups: [createNewGroup('probeDroid', {}, 2, 'normal', 'red', 1)],
  };
  const state = reducer(testState, removeFromOpenGroups('probeDroid'));
  expect(state.openGroups.length).toEqual(0);
});
