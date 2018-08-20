// @flow

import {call, put, select, take} from 'redux-saga/effects';
import {getDifficulty, getImperialRewards, getMissionThreat} from '../../app';
import {deployNewGroups} from '../../imperials';
import {displayModal} from '../../modal';
import {getDeploymentPoint} from '../../mission';
import waitForModal from '../../../sagas/waitForModal';

export default function* helperDeployGroupInteractive(
  title: string,
  unitsToDeploy: string[],
  location: ?string
): Generator<*, *, *> {
  const missionDeploymentPoint: string = yield select(getDeploymentPoint);

  for (var i = 0; i < unitsToDeploy.length; i++) {
    // Display a modal saying we're going to deploy
    yield put(
      displayModal('DEPLOY_GROUP_INTERACTIVE', {
        group: unitsToDeploy[i],
        location: location || missionDeploymentPoint,
        title,
      })
    );
    yield call(waitForModal('DEPLOY_GROUP_INTERACTIVE'));
    const response = yield take('DEPLOY_GROUP_INTERACTIVE_MODAL_ANSWER');
    const {color, number} = response.payload;
    // Deploy this grouop
    const missionThreat = yield select(getMissionThreat);
    const difficulty = yield select(getDifficulty);
    const imperialRewards = yield select(getImperialRewards);
    yield put(
      deployNewGroups([unitsToDeploy[i]], missionThreat, difficulty, color, number, imperialRewards)
    );
  }
}
