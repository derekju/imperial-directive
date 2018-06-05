import {getIsThereReadyRebelFigures} from './rebels';

const initialState = {
  activatedRebels: [],
  allyChosen: null,
  canActivateTwice: [],
  canIncapacitate: [],
  enableEscape: false,
  escapedRebels: [],
  fakeWithdrawnHeroes: [],
  hpBoosts: {},
  roster: [],
  withdrawnHeroes: [],
  woundedHeroes: [],
  woundedOther: [],
};

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
