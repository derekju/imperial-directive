import reducer, {initialState, updateMapImage} from './mission';

test('test updateMapImage', () => {
  let state = {
    ...initialState,
    mapImage: [
      ['00a', '01a', '01a', '01a', '00a'],
      ['00a', '01a', '01a', '01a', '00a'],
      ['00a', '01a', '01a', '01a', '00a'],
      ['20a', '20a', '00a', '30a', '30a'],
      ['20a', '20a', '00a', '30a', '30a'],
    ],
  };
  state = reducer(state, updateMapImage([[1, 2, ['10a', '10a', '10a']], [4, 3, ['00a', '00a']]]));
  expect(state.mapImage[1][2]).toEqual('10a');
  expect(state.mapImage[1][3]).toEqual('10a');
  expect(state.mapImage[1][4]).toEqual('10a');
  expect(state.mapImage[4][3]).toEqual('00a');
  expect(state.mapImage[4][4]).toEqual('00a');
});
