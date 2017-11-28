// @flow

import {call, put} from 'redux-saga/effects';
import {deployNewGroups} from '../../imperials';
import {displayModal} from '../../modal';
import waitForModal from '../../../sagas/waitForModal';

export default function* helperDeploy(
  story: string,
  text: string[],
  title: string,
  groups: string[]
): Generator<*, *, *> {
  // Display a modal saying we're going to deploy
  yield put(
    displayModal('RESOLVE_EVENT', {
      story,
      text,
      title,
    })
  );
  yield call(waitForModal('RESOLVE_EVENT'));
  // Do the deployment from reserved groups
  yield put(deployNewGroups(groups));
}
