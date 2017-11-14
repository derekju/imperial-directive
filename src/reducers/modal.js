// @flow

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

// Action creators

export const displayModal = (type: string, data?: Object = {}) => ({
  payload: {data, type},
  type: DISPLAY_MODAL,
});
export const closeModals = () => ({type: CLOSE_MODALS});

// Selectors

// Sagas
