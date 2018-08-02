import handleHeroesWounded from './handleHeroesWounded';

test('handleHeroesWounded correctly handles when not all heroes wounded', () => {
  const fn = handleHeroesWounded('aftermath', 'aftermath');
  const gen = fn();

  // Taking a wound action
  let result = gen.next();
  // Selecting if heroes are wounded
  result = gen.next();
  // Display modal for imperial victory
  result = gen.next(false);
  // Will go to the selector for only one hero left
  expect('PUT' in result.value).toBeFalsy();
});

test('handleHeroesWounded correctly handles only heroes wounded', () => {
  const fn = handleHeroesWounded('aftermath', 'aftermath');
  const gen = fn();

  // Taking a wound action
  let result = gen.next();
  // Selecting if heroes are wounded
  result = gen.next();
  // Display modal for imperial victory
  result = gen.next(true);
  expect(result.value.PUT.action.payload.type).toEqual('IMPERIAL_VICTORY');
});

test('handleHeroesWounded correctly handles heroes wounded with 1 ally', () => {
  const fn = handleHeroesWounded('aftermath', 'aftermath', 'han');
  const gen = fn();

  // Taking a wound action
  let result = gen.next();
  // Selecting if heroes are wounded
  result = gen.next();
  // Selecting if others are wounded
  result = gen.next(true);
  // Display modal for imperial victory
  result = gen.next(['han']);
  expect(result.value.PUT.action.payload.type).toEqual('IMPERIAL_VICTORY');
});

test('handleHeroesWounded correctly handles heroes wounded but 1 ally not', () => {
  const fn = handleHeroesWounded('aftermath', 'aftermath', 'han');
  const gen = fn();

  // Taking a wound action
  let result = gen.next();
  // Selecting if heroes are wounded
  result = gen.next();
  // Selecting if others are wounded
  result = gen.next(true);
  // Display modal for imperial victory
  result = gen.next([]);
  // Will go to the selector for only one hero left
  expect('PUT' in result.value).toBeFalsy();
});

test('handleHeroesWounded correctly handles heroes wounded ally with multiple units', () => {
  const fn = handleHeroesWounded('aftermath', 'aftermath', 'echoBaseTrooper');
  const gen = fn();

  // Taking a wound action
  let result = gen.next();
  // Selecting if heroes are wounded
  result = gen.next();
  // Selecting if others are wounded
  result = gen.next(true);
  // Display modal for imperial victory
  result = gen.next(['echoBaseTrooper']);
  expect(result.value.PUT.action.payload.type).toEqual('IMPERIAL_VICTORY');
});
