// @flow

import {applyMiddleware, combineReducers, compose, createStore} from 'redux';
import createSagaMiddleware from 'redux-saga';
// import {CURRENT_MISSION_KEY} from './constants';
import persistMiddleware from './lib/persistMiddleware';
import reducers from './reducers';
import rootSaga from './sagas/rootSaga';

export default () => {
  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

  /*
  const previousMissionState = window.localStorage.getItem(CURRENT_MISSION_KEY);
  let parsedMissionState = undefined;
  try {
    parsedMissionState = JSON.parse(previousMissionState);
  } catch (e) {
    parsedMissionState = undefined;
  }
  */

  const sagaMiddleware = createSagaMiddleware();
  const store = createStore(
    combineReducers(reducers),
    composeEnhancers(applyMiddleware(sagaMiddleware, persistMiddleware))
  );

  sagaMiddleware.run(rootSaga);

  return store;
};
