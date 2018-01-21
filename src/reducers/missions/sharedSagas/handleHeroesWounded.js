// @flow

import {getAreAllHeroesWounded, getIsOneHeroLeft, WOUND_REBEL_HERO} from '../../rebels';
import {put, select, take} from 'redux-saga/effects';
import {setAttackTarget, setMoveTarget} from '../../mission';
import createAction from '../../createAction';
import {displayModal} from '../../modal';
import {TARGET_REMAINING} from '../constants';
import track from '../../../lib/track';

export default function handleHeroesWounded(missionName: string, actionName: string) {
  return function* handleHeroesWoundedImpl(): Generator<*, *, *> {
    while (true) {
      yield take(WOUND_REBEL_HERO);
      const allWounded = yield select(getAreAllHeroesWounded);
      if (allWounded) {
        // End game with imperial victory
        yield put(displayModal('IMPERIAL_VICTORY'));
        track(missionName, 'defeat', 'wounded');
        break;
      }
      const isOneHeroLeft = yield select(getIsOneHeroLeft);
      if (isOneHeroLeft) {
        // Switch targets
        yield put(createAction(actionName, true));
        yield put(setAttackTarget(TARGET_REMAINING));
        yield put(setMoveTarget(TARGET_REMAINING));
      }
    }
  };
}
