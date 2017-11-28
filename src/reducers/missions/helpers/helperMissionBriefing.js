// @flow

import {call, put} from 'redux-saga/effects';
import {displayModal} from '../../modal';
import {REFER_CAMPAIGN_GUIDE} from '../constants';
import waitForModal from '../../../sagas/waitForModal';

export default function* helperMissionBriefing(briefing: string[]): Generator<*, *, *> {
  yield put(
    displayModal('RESOLVE_EVENT', {
      story: REFER_CAMPAIGN_GUIDE,
      text: briefing,
      title: 'Mission Briefing',
    })
  );
  yield call(waitForModal('RESOLVE_EVENT'));
}
