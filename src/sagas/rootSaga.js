// @flow

import {all} from 'redux-saga/effects';
import {appSaga} from '../reducers/app';
import {eventsSaga} from '../reducers/events';
import {imperialsSaga} from '../reducers/imperials';
import {missionSaga} from '../reducers/mission';

export default function* rootSaga(): Generator<*, *, *> {
  // TODO: Order shouldn't matter here but it does e.g. appSaga needs to be last
  yield all([eventsSaga(), imperialsSaga(), missionSaga(), appSaga()]);
}
