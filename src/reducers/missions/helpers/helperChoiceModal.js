// @flow

import {call, put, take} from 'redux-saga/effects';
import {displayModal} from '../../modal';
import waitForModal from '../../../sagas/waitForModal';

export default function* helperChoiceModal(question: string, title: string): Generator<*, *, *> {
  yield put(
    displayModal('CHOICE_MODAL', {
      question,
      title,
    })
  );
  yield call(waitForModal('CHOICE_MODAL'));
  const response = yield take('CHOICE_MODAL_ANSWER');
  const {answer} = response.payload;
  return answer;
}
