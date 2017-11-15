// @flow

import {take} from 'redux-saga/effects';

export default (type: string) =>
  function* waitForModal(): Generator<*, *, *> {
    yield take((action: Object) => action.type === 'CLOSE_MODALS' && action.payload.type === type);
  };
