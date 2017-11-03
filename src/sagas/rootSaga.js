// @flow

import {all} from 'redux-saga/effects';
import {appSaga} from '../reducers/app';
import {missionSaga} from '../reducers/mission';

export default function* rootSaga(): Generator<*, *, *> {
  // TODO: Order shouldn't matter here but it does
  yield all([missionSaga(), appSaga()]);
}
