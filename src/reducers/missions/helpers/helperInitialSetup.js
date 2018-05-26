// @flow

import {call, put} from 'redux-saga/effects';
import {displayModal} from '../../modal';
import helperDeployGroupInteractive from './helperDeployGroupInteractive';
import waitForModal from '../../../sagas/waitForModal';

export default function* helperInitialSetup(unitsToDeploy: string[]): Generator<*, *, *> {
  yield put(
    displayModal('RESOLVE_EVENT', {
      buttonText: 'Next',
      text: ['Deploy the following units to the specified position from the mission map.'],
      title: 'Initial Setup',
    })
  );
  yield call(waitForModal('RESOLVE_EVENT'));
  yield call(
    helperDeployGroupInteractive,
    'Initial Setup',
    unitsToDeploy,
    'Deploy to the location marked on the mission map.'
  );
}
