// @flow

import {put, select, take} from 'redux-saga/effects';
import {
  getLastDeployedGroupOfId,
  SET_INTERRUPTED_GROUP,
  setInterruptedGroup,
} from '../../imperials';

export default function* helperShowInterruptedGroup(groupId: string): Generator<*, *, *> {
  const group = yield select(getLastDeployedGroupOfId, groupId);
  yield put(setInterruptedGroup(group));
  // Wait for panel to be dismissed
  yield take(SET_INTERRUPTED_GROUP);
}
