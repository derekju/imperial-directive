// @flow
/* globals Raven */

import {applyMiddleware, combineReducers, compose, createStore} from 'redux';
import {connectRouter, routerMiddleware} from 'connected-react-router'

import createSagaMiddleware from 'redux-saga';
// import {CURRENT_MISSION_KEY} from './constants';
import persistMiddleware from './lib/persistMiddleware';
import reducers from './reducers';
import rootSaga from './sagas/rootSaga';

export default (history: Object) => {
  let composeEnhancers = compose;
  if (process.env.NODE_ENV === 'development') {
    composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
  }

  /*
  const previousMissionState = window.localStorage.getItem(CURRENT_MISSION_KEY);
  let parsedMissionState = undefined;
  try {
    parsedMissionState = JSON.parse(previousMissionState);
  } catch (e) {
    parsedMissionState = undefined;
  }
  */

  const rootReducer = combineReducers(reducers);

  const sagaMiddleware = createSagaMiddleware({
    onError: e => {
      // $FlowFixMe - Don't worry about this
      Raven.captureException(e);
      throw e;
    },
  });
  const store = createStore(
    connectRouter(history)(rootReducer),
    composeEnhancers(applyMiddleware(routerMiddleware(history), sagaMiddleware, persistMiddleware))
  );

  sagaMiddleware.run(rootSaga);

  return store;
};
