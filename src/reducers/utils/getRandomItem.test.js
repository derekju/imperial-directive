import getRandomItem from './getRandomItem';

test('getRandomItem returns a random element', () => {
  const results = [];
  // Average over 100
  for (let i = 0; i < 100; i++) {
    results.push(getRandomItem(1, 2, 3, 4, 5));
  }
  expect(results.includes(1)).toBeTruthy();
  expect(results.includes(2)).toBeTruthy();
  expect(results.includes(3)).toBeTruthy();
  expect(results.includes(4)).toBeTruthy();
  expect(results.includes(5)).toBeTruthy();
});
