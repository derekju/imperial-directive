// @flow

import {call, put} from 'redux-saga/effects';
import {displayModal} from '../../modal';
import waitForModal from '../../../sagas/waitForModal';

export default function* helperEventModal(modalData: Object): Generator<*, *, *> {
  yield put(displayModal('RESOLVE_EVENT', modalData));
  yield call(waitForModal('RESOLVE_EVENT'));
}
