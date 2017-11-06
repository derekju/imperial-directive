// @flow

// Constants

// Types

// Utils

// State

const initialState = {
  type: '',
};

export default (state: Object = initialState, action: Object) => {
  switch (action.type) {
    case DISPLAY_MODAL:
      return {
        ...state,
        type: action.payload.type,
      };
    default:
      return state;
  }
};

// Action types

export const DISPLAY_MODAL = 'DISPLAY_MODAL';

// Action creators

export const displayModal = (type: string) => ({payload: {type}, type: DISPLAY_MODAL});

// Selectors

// Sagas
