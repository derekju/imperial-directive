// @flow

import createAction from './createAction';

// Constants

// Types

export type ModalStateType = {
  data: Object,
  type: string,
};

// Utils

// State

const initialState = {
  data: {},
  type: '',
};

export default (state: ModalStateType = initialState, action: Object) => {
  switch (action.type) {
    case DISPLAY_MODAL:
      const {data, type} = action.payload;
      return {
        ...state,
        data,
        type,
      };
    case CLOSE_MODALS:
      return initialState;
    default:
      return state;
  }
};

// Action types

export const DISPLAY_MODAL = 'DISPLAY_MODAL';
export const CLOSE_MODALS = 'CLOSE_MODALS';
export const CHOICE_MODAL_ANSWER = 'CHOICE_MODAL_ANSWER';
export const DEPLOY_GROUP_INTERACTIVE_MODAL_ANSWER = 'DEPLOY_GROUP_INTERACTIVE_MODAL_ANSWER';

// Action creators

export const displayModal = (type: string, data?: Object = {}) =>
  createAction(DISPLAY_MODAL, {data, type});
export const closeModals = (type: string) => createAction(CLOSE_MODALS, {type});
export const choiceModalAnswer = (answer: string) => createAction(CHOICE_MODAL_ANSWER, {answer});
export const deployGroupInteractiveModalAnswer = (color: string, number: number) =>
  createAction(DEPLOY_GROUP_INTERACTIVE_MODAL_ANSWER, {color, number});

// Selectors

// Sagas
