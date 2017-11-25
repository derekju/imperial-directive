// @flow

import {put, select} from 'redux-saga/effects';
import {getMissionThreat} from '../../app';
import {increaseThreat} from '../../mission';

export default function* helperIncreaseThreat(factor: number): Generator<*, *, *> {
  const missionThreat = yield select(getMissionThreat);
  yield put(increaseThreat(missionThreat * factor));
}
