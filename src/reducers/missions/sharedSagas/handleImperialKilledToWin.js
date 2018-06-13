// @flow

import {put, take} from 'redux-saga/effects';
import {DEFEAT_IMPERIAL_FIGURE} from '../../imperials';
import {displayModal} from '../../modal';
import track from '../../../lib/track';

export default function handleImperialKilledToWin(groupId: string, missionName: string) {
  return function* handleImperialKilledToWinImpl(): Generator<*, *, *> {
    while (true) {
      const action = yield take(DEFEAT_IMPERIAL_FIGURE);
      const {group} = action.payload;
      if (group.id === groupId) {
        yield put(displayModal('REBEL_VICTORY'));
        track(missionName, 'victory', groupId);
        break;
      }
    }
  };
}
