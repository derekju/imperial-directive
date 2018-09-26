// @flow

import {call, put, take} from 'redux-saga/effects';
import {displayModal} from '../../modal';
import helperCheckMapStateActivations from '../helpers/helperCheckMapStateActivations';
import {SET_MAP_STATE_ACTIVATED} from '../../mission';
import track from '../../../lib/track';

export default function handleObjectsAllActivated(
  objectsToCheck: string[],
  missionName: string,
  outcomeModalType: string,
  outcomeTrackAction: string,
  outcomeTrackLabel: string
) {
  return function* handleObjectsAllActivatedImpl(): Generator<*, *, *> {
    while (true) {
      yield take(SET_MAP_STATE_ACTIVATED);
      console.log('INSIDE handleObjectsAllActivated');
      const allActivated = yield call(
        helperCheckMapStateActivations,
        objectsToCheck,
        objectsToCheck.length
      );
      console.log(allActivated);
      if (allActivated) {
        yield put(displayModal(outcomeModalType));
        track(missionName, outcomeTrackAction, outcomeTrackLabel);
        // We're done
        break;
      }
    }
  };
}
