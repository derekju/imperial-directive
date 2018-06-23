// @flow

import {
  getAreAllHeroesWounded,
  getIsOneHeroLeft,
  getWoundedOther,
  WOUND_REBEL_HERO,
  WOUND_REBEL_OTHER,
} from '../../rebels';
import {put, select, take} from 'redux-saga/effects';
import {setAttackTarget, setMoveTarget} from '../../mission';
import createAction from '../../createAction';
import {displayModal} from '../../modal';
import {TARGET_REMAINING} from '../constants';
import track from '../../../lib/track';

export default function handleHeroesWounded(
  missionName: string,
  actionName: string,
  ...additionalAllies: string[]
) {
  return function* handleHeroesWoundedImpl(): Generator<*, *, *> {
    while (true) {
      yield take([WOUND_REBEL_HERO, WOUND_REBEL_OTHER]);
      const allWounded = yield select(getAreAllHeroesWounded);
      let allyCheckPass = true;

      // If we need to check for an ally also
      if (additionalAllies.length) {
        const woundedOther = yield select(getWoundedOther);
        additionalAllies.forEach((additionalAlly: string) => {
          allyCheckPass = allyCheckPass && woundedOther.includes(additionalAlly);
        });
      }

      if (allWounded && allyCheckPass) {
        // End game with imperial victory
        yield put(displayModal('IMPERIAL_VICTORY'));
        track(missionName, 'defeat', 'wounded');
        break;
      }
      const isOneHeroLeft = yield select(getIsOneHeroLeft);
      if (isOneHeroLeft && additionalAllies.length === 0) {
        // Switch targets
        yield put(createAction(actionName, true));
        yield put(setAttackTarget(TARGET_REMAINING));
        yield put(setMoveTarget(TARGET_REMAINING));
      }
    }
  };
}
