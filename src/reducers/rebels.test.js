import reducer, {
  addSingleUnitToRoster,
  addToRoster,
  getIsThereReadyRebelFigures,
  getRosterOfType,
  setRebelHpBoost,
  setRoster,
  woundRebelOther,
} from './rebels';

const initialState = {
  activatedRebels: [],
  allyChosen: null,
  canActivateTwice: [],
  canIncapacitate: [],
  enableEscape: false,
  escapedRebels: [],
  fakeWithdrawnHeroes: [],
  roster: [],
  withdrawnHeroes: [],
  woundedHeroes: [],
  woundedOther: [],
};

test('test SET_ROSTER with one hero', () => {
  let state = reducer(undefined, {});
  state = reducer(state, setRoster(['diala']));
  expect(state.roster.length).toEqual(1);
  expect(state.roster[0].currentNumFigures).toEqual(1);
  expect(state.roster[0].hpBoost).toEqual(0);
});

test('test SET_ROSTER with 2 heroes', () => {
  let state = reducer(undefined, {});
  state = reducer(state, setRoster(['diala', 'fenn']));
  expect(state.roster.length).toEqual(2);
  expect(state.roster[0].currentNumFigures).toEqual(1);
  expect(state.roster[0].hpBoost).toEqual(10);
});

test('test SET_ROSTER with 3 heroes', () => {
  let state = reducer(undefined, {});
  state = reducer(state, setRoster(['diala', 'fenn', 'gideon']));
  expect(state.roster.length).toEqual(3);
  expect(state.roster[0].hpBoost).toEqual(3);
});

test('test SET_ROSTER with 4 heroes', () => {
  let state = reducer(undefined, {});
  state = reducer(state, setRoster(['diala', 'fenn', 'gideon', 'jyn']));
  expect(state.roster.length).toEqual(4);
  expect(state.roster[0].hpBoost).toEqual(0);
});

test('test SET_ROSTER with 4 heroes and an ally', () => {
  let state = reducer(undefined, {});
  state = reducer(state, setRoster(['diala', 'fenn', 'gideon', 'jyn', 'rebelTrooper']));
  expect(state.roster.length).toEqual(5);
  expect(state.roster[4].currentNumFigures).toEqual(3);
});

test('test ADD_TO_ROSTER', () => {
  let state = reducer(undefined, {});
  state = reducer(state, setRoster(['diala', 'fenn', 'gideon', 'jyn']));
  expect(state.roster.length).toEqual(4);
  state = reducer(state, addToRoster('rebelTrooper'));
  expect(state.roster.length).toEqual(5);
  expect(state.roster[4].currentNumFigures).toEqual(3);
});

test('test ADD_SINGLE_UNIT_TO_ROSTER with han', () => {
  let state = reducer(undefined, {});
  state = reducer(state, setRoster(['diala', 'fenn', 'gideon', 'jyn']));
  expect(state.roster.length).toEqual(4);
  state = reducer(state, addSingleUnitToRoster('han'));
  expect(state.roster.length).toEqual(5);
  expect(state.roster[4].currentNumFigures).toEqual(1);
});

test('test ADD_SINGLE_UNIT_TO_ROSTER with rebel troopers', () => {
  let state = reducer(undefined, {});
  state = reducer(state, setRoster(['diala', 'fenn', 'gideon', 'jyn', 'rebelTrooper']));
  expect(state.roster.length).toEqual(5);
  state = reducer(state, addSingleUnitToRoster('rebelTrooper'));
  expect(state.roster.length).toEqual(5);
  expect(state.roster[4].currentNumFigures).toEqual(3);
  state = reducer(state, woundRebelOther('rebelTrooper'));
  expect(state.roster[4].currentNumFigures).toEqual(2);
  state = reducer(state, addSingleUnitToRoster('rebelTrooper'));
  expect(state.roster[4].currentNumFigures).toEqual(3);
  state = reducer(state, woundRebelOther('rebelTrooper'));
  state = reducer(state, woundRebelOther('rebelTrooper'));
  state = reducer(state, woundRebelOther('rebelTrooper'));
  expect(state.roster.length).toEqual(4);
  state = reducer(state, addSingleUnitToRoster('rebelTrooper'));
  expect(state.roster.length).toEqual(5);
  expect(state.roster[4].currentNumFigures).toEqual(1);
});

test('test WOUND_REBEL_OTHER with only 1 unit', () => {
  let state = reducer(undefined, {});
  state = reducer(state, setRoster(['diala', 'fenn', 'gideon', 'jyn', 'han']));
  expect(state.roster.length).toEqual(5);
  state = reducer(state, woundRebelOther('han'));
  expect(state.roster.length).toEqual(4);
});

test('test WOUND_REBEL_OTHER with multiple allies', () => {
  let state = reducer(undefined, {});
  state = reducer(state, setRoster(['diala', 'fenn', 'gideon', 'jyn', 'han', 'c3p0', 'r2d2']));
  expect(state.roster.length).toEqual(7);
  state = reducer(state, woundRebelOther('han'));
  expect(state.roster.length).toEqual(6);
});

test('test WOUND_REBEL_OTHER with only multi unit', () => {
  let state = reducer(undefined, {});
  state = reducer(state, setRoster(['diala', 'fenn', 'gideon', 'jyn', 'rebelTrooper']));
  expect(state.roster.length).toEqual(5);
  expect(state.roster[4].currentNumFigures).toEqual(3);
  state = reducer(state, woundRebelOther('rebelTrooper'));
  expect(state.roster.length).toEqual(5);
  expect(state.roster[4].currentNumFigures).toEqual(2);
  state = reducer(state, woundRebelOther('rebelTrooper'));
  expect(state.roster.length).toEqual(5);
  expect(state.roster[4].currentNumFigures).toEqual(1);
  state = reducer(state, woundRebelOther('rebelTrooper'));
  expect(state.roster.length).toEqual(4);
});

test('test setRebelHpBoost', () => {
  let state = reducer(undefined, {});
  state = reducer(state, setRoster(['diala', 'fenn', 'gideon', 'jyn']));
  expect(state.roster[0].hpBoost).toEqual(0);
  state = reducer(state, setRebelHpBoost('diala', 5));
  expect(state.roster[0].hpBoost).toEqual(5);
});

test('getRosterOfType works as expected', () => {
  let state = reducer(undefined, {});
  state = reducer(state, setRoster(['diala', 'fenn', 'gideon', 'jyn', 'rebelTrooper']));
  expect(getRosterOfType({rebels: state}, 'hero').length).toEqual(4);
  expect(getRosterOfType({rebels: state}, 'ally').length).toEqual(1);
});

test('getIsThereReadyRebelFigures: 4 heroes returns true with no heroes gone', () => {
  const testState = Object.assign({}, initialState, {
    activatedRebels: [],
    canActivateTwice: [],
    roster: ['a', 'b', 'c', 'd'],
    withdrawnHeroes: [],
  });
  expect(getIsThereReadyRebelFigures({rebels: testState})).toBeTruthy();
});

test('getIsThereReadyRebelFigures: 4 heroes returns true with 1 hero moving', () => {
  const testState = Object.assign({}, initialState, {
    activatedRebels: ['a'],
    canActivateTwice: [],
    roster: ['a', 'b', 'c', 'd'],
    withdrawnHeroes: [],
  });
  expect(getIsThereReadyRebelFigures({rebels: testState})).toBeTruthy();
});

test('getIsThereReadyRebelFigures: 4 heroes returns true with 2 heroes moving', () => {
  const testState = Object.assign({}, initialState, {
    activatedRebels: ['a', 'b'],
    canActivateTwice: [],
    roster: ['a', 'b', 'c', 'd'],
    withdrawnHeroes: [],
  });
  expect(getIsThereReadyRebelFigures({rebels: testState})).toBeTruthy();
});

test('getIsThereReadyRebelFigures: 4 heroes returns true with 3 heroes moving', () => {
  const testState = Object.assign({}, initialState, {
    activatedRebels: ['a', 'b', 'c'],
    canActivateTwice: [],
    roster: ['a', 'b', 'c', 'd'],
    withdrawnHeroes: [],
  });
  expect(getIsThereReadyRebelFigures({rebels: testState})).toBeTruthy();
});

test('getIsThereReadyRebelFigures: 4 heroes returns false with 4 heroes moving', () => {
  const testState = Object.assign({}, initialState, {
    activatedRebels: ['a', 'b', 'c', 'd'],
    canActivateTwice: [],
    roster: ['a', 'b', 'c', 'd'],
    withdrawnHeroes: [],
  });
  expect(getIsThereReadyRebelFigures({rebels: testState})).toBeFalsy();
});

test('getIsThereReadyRebelFigures: 4 heroes returns true with 3 heroes moving, 1 withdrawn that is not the one that can still move', () => {
  const testState = Object.assign({}, initialState, {
    activatedRebels: ['a', 'c'],
    canActivateTwice: [],
    roster: ['a', 'b', 'c', 'd'],
    withdrawnHeroes: ['b'],
  });
  expect(getIsThereReadyRebelFigures({rebels: testState})).toBeTruthy();
});

test('getIsThereReadyRebelFigures: 4 heroes returns false with 3 heroes moving, 1 withdrawn that is the one that can still move', () => {
  const testState = Object.assign({}, initialState, {
    activatedRebels: ['a', 'b', 'c'],
    canActivateTwice: [],
    roster: ['a', 'b', 'c', 'd'],
    withdrawnHeroes: ['d'],
  });
  expect(getIsThereReadyRebelFigures({rebels: testState})).toBeFalsy();
});

test('getIsThereReadyRebelFigures: 3 heroes returns true with 1 hero moving', () => {
  const testState = Object.assign({}, initialState, {
    activatedRebels: ['a'],
    canActivateTwice: ['a'],
    roster: ['a', 'b', 'c'],
    withdrawnHeroes: [],
  });
  expect(getIsThereReadyRebelFigures({rebels: testState})).toBeTruthy();
});

test('getIsThereReadyRebelFigures: 3 heroes returns true with 2 heros moving', () => {
  const testState = Object.assign({}, initialState, {
    activatedRebels: ['a', 'b'],
    canActivateTwice: ['a'],
    roster: ['a', 'b', 'c'],
    withdrawnHeroes: [],
  });
  expect(getIsThereReadyRebelFigures({rebels: testState})).toBeTruthy();
});

test('getIsThereReadyRebelFigures: 3 heroes returns true with 3 heroes moving', () => {
  const testState = Object.assign({}, initialState, {
    activatedRebels: ['a', 'b', 'c'],
    canActivateTwice: ['a'],
    roster: ['a', 'b', 'c'],
    withdrawnHeroes: [],
  });
  expect(getIsThereReadyRebelFigures({rebels: testState})).toBeTruthy();
});

test('getIsThereReadyRebelFigures: 3 heroes returns false with 3 heroes moving with double move done', () => {
  const testState = Object.assign({}, initialState, {
    activatedRebels: ['a', 'a', 'b', 'c'],
    canActivateTwice: ['a'],
    roster: ['a', 'b', 'c'],
    withdrawnHeroes: [],
  });
  expect(getIsThereReadyRebelFigures({rebels: testState})).toBeFalsy();
});

test('getIsThereReadyRebelFigures: 3 heroes returns true with 3 heroes moving and 1 withdrawn that is not the one that can still move', () => {
  const testState = Object.assign({}, initialState, {
    activatedRebels: ['a', 'c'],
    canActivateTwice: ['a'],
    roster: ['a', 'b', 'c'],
    withdrawnHeroes: ['b'],
  });
  expect(getIsThereReadyRebelFigures({rebels: testState})).toBeTruthy();
});

test('getIsThereReadyRebelFigures: 3 heroes returns false with 3 heroes moving and 1 withdrawn that is the one that can still move', () => {
  const testState = Object.assign({}, initialState, {
    activatedRebels: ['a', 'b', 'c'],
    canActivateTwice: ['a'],
    roster: ['a', 'b', 'c'],
    withdrawnHeroes: ['a'],
  });
  expect(getIsThereReadyRebelFigures({rebels: testState})).toBeFalsy();
});
