// @flow

import {call, put} from 'redux-saga/effects';
import {displayModal} from '../../modal';
import helperDeployGroupInteractive from './helperDeployGroupInteractive';
import waitForModal from '../../../sagas/waitForModal';

export default function* helperDeploy(
  title: string,
  story: string,
  text: string,
  ...groupData: Array<string[]>
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
  for (let i = 0; i < groupData.length; i++) {
    const [groupId, deploymentText] = groupData[i];
    yield call(helperDeployGroupInteractive, title, [groupId], deploymentText);
  }
}
