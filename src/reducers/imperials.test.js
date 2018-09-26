import reducer, {
  createNewGroup,
  initialState,
  removeFromOpenGroups,
  setCustomUnitAI,
} from './imperials';

test('test removeFromOpenGroups', () => {
  const testState = {
    ...initialState,
    openGroups: [createNewGroup('probeDroid', {}, 2, 'normal', 'red', 1, {})],
  };
  const state = reducer(testState, removeFromOpenGroups('probeDroid'));
  expect(state.openGroups.length).toEqual(0);
});

test('test createNewGroup with Bounty reward', () => {
  const hunterGroup = createNewGroup('trandoshanHunter', {}, 5, 'normal', 'red', 1, {bounty: true});
  expect(hunterGroup.threat).toEqual(6);
  const noBounty = createNewGroup('trandoshanHunter', {}, 5, 'normal', 'red', 1, {});
  expect(noBounty.threat).toEqual(7);
  const nonHunter = createNewGroup('probeDroid', {}, 5, 'normal', 'red', 1, {bounty: true});
  expect(nonHunter.threat).toEqual(3);
});

test('test setCustomUnitAI with one single unit', () => {
  const testState = {
    ...initialState,
  };
  const state = reducer(testState, setCustomUnitAI('probeDroid', ['hello']));
  expect(state.customUnitAI.probeDroid).toEqual(['hello']);
});

test('test setCustomUnitAI with multiple units', () => {
  const testState = {
    ...initialState,
  };
  const state = reducer(
    testState,
    setCustomUnitAI(['probeDroid', 'stormtrooper', 'eWebEngineer'], ['hello'])
  );
  expect(state.customUnitAI.probeDroid).toEqual(['hello']);
  expect(state.customUnitAI.stormtrooper).toEqual(['hello']);
  expect(state.customUnitAI.eWebEngineer).toEqual(['hello']);
});
