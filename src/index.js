// @flow
/* globals Raven */

import App from './App';
import {createBrowserHistory} from 'history';
import createReduxStore from './createReduxStore';
import {Provider} from 'react-redux';
import React from 'react';
import ReactDOM from 'react-dom';

// Enable sentry
// $FlowFixMe - Don't worry about this
Raven.config('https://7ef639277a014700948a0a97d076c536@sentry.io/264340').install();

const history = createBrowserHistory();
const store = createReduxStore(history);

ReactDOM.render(
  <Provider store={store}>
    <App history={history} />
  </Provider>,
  // $FlowFixMe
  document.getElementById('root')
);
