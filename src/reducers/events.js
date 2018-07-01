// @flow

import {put, select, takeEvery} from 'redux-saga/effects';
import {EVENT_PHASE_BEGIN, eventPhaseEnd} from './mission';
import {displayModal} from './modal';
import random from 'lodash/random';
import type {StateType} from './types';
import waitForModal from '../sagas/waitForModal';
import without from 'lodash/without';

// Types

export type EventType = {
  name: string,
  text: string[],
  type: string,
};

export type EventsStateType = {
  activeEvent: ?EventType,
  discardedEvents: EventType[],
  eventPool: EventType[],
};

// State

const initialState = {
  activeEvent: null,
  discardedEvents: [],
  eventPool: [],
};

export default (state: EventsStateType = initialState, action: Object) => {
  switch (action.type) {
    case LOAD_EVENTS:
      return {
        ...state,
        eventPool: action.payload.events,
      };
    case SET_EVENT_AS_ACTIVE:
      const {event} = action.payload;
      return {
        ...state,
        activeEvent: event,
        discardedEvents: (state.discardedEvents.concat(
          state.activeEvent ? [state.activeEvent] : []
        ): EventType[]),
        eventPool: without(state.eventPool, event.name),
      };
    default:
      return state;
  }
};

// Action types

export const LOAD_EVENTS = 'LOAD_EVENTS';
export const SET_EVENT_AS_ACTIVE = 'SET_EVENT_AS_ACTIVE';

// Action creators

export const loadEvents = (events: EventType[]) => ({payload: {events}, type: LOAD_EVENTS});
export const setEventAsActive = (event: EventType) => ({
  payload: {event},
  type: SET_EVENT_AS_ACTIVE,
});

// Selectors

export const getEventPool = (state: StateType) => state.events.eventPool;

// Sagas

function* handleEventPhaseBegin(): Generator<*, *, *> {
  const eventPool = yield select(getEventPool);
  const randomNumber = random(0, eventPool.length - 1);
  const randomEvent = eventPool[randomNumber];
  yield put(setEventAsActive(randomEvent));
  // Tell the user which event is being displayed
  yield put(displayModal('NEW_EVENT_MODAL', {event: randomEvent}));
  // Proceed
  waitForModal('NEW_EVENT_MODAL');
  yield put(eventPhaseEnd());
}

export function* eventsSaga(): Generator<*, *, *> {
  yield takeEvery(EVENT_PHASE_BEGIN, handleEventPhaseBegin);
}
