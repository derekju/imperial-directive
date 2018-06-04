// @flow

import {call, put, take} from 'redux-saga/effects';
import {displayModal} from '../../modal';
import waitForModal from '../../../sagas/waitForModal';

export default function* helperChoiceModal(
  question: string,
  title: string,
  yesText: string,
  noText: string
): Generator<*, *, *> {
  yield put(
    displayModal('CHOICE_MODAL', {
      noText,
      question,
      title,
      yesText,
    })
  );
  yield call(waitForModal('CHOICE_MODAL'));
  const response = yield take('CHOICE_MODAL_ANSWER');
  const {answer} = response.payload;
  return answer;
}
