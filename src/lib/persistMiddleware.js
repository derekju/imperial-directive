// @flow

import {CURRENT_MISSION_KEY} from '../constants';

export default (store: Object) => (next: Function) => (action: Object) => {
  const result = next(action);
  const nextState = store.getState();
  window.localStorage.setItem(CURRENT_MISSION_KEY, JSON.stringify(nextState));
  return result;
};
