// @flow

import {call, put} from 'redux-saga/effects';
import {displayModal} from '../../modal';
import waitForModal from '../../../sagas/waitForModal';

export default function* helperInitialSetup(unitsToDeploy: string): Generator<*, *, *> {
  yield put(
    displayModal('RESOLVE_EVENT', {
      text: ['Deploy the following units as specified on the map:', unitsToDeploy],
      title: 'Initial Setup',
    })
  );
  yield call(waitForModal('RESOLVE_EVENT'));
}
