// @flow

import {call, put, select} from 'redux-saga/effects';
import {deployNewGroups} from '../../imperials';
import {displayModal} from '../../modal';
import {getMissionThreat} from '../../app';
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
  const missionThreat = yield select(getMissionThreat);
  yield put(deployNewGroups(groups, missionThreat));
}
