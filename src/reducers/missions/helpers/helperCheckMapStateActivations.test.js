import helperCheckMapStateActivations from './helperCheckMapStateActivations';

test('helperCheckMapStateActivations returns false if not enough', () => {
  const mapStates = {
    'terminal-1': {activated: false},
    'terminal-2': {activated: true},
  };

  const gen = helperCheckMapStateActivations(['terminal-1', 'terminal-2'], 2);

  // Getting map states
  let result = gen.next();
  // Proceeding
  result = gen.next(mapStates);

  expect(result.value).toEqual(false);
});

test('helperCheckMapStateActivations returns true if enough', () => {
  const mapStates = {
    'terminal-1': {activated: true},
    'terminal-2': {activated: true},
  };

  const gen = helperCheckMapStateActivations(['terminal-1', 'terminal-2'], 2);

  // Getting map states
  let result = gen.next();
  // Proceeding
  result = gen.next(mapStates);

  expect(result.value).toEqual(true);
});
