// @flow

import App from './App';
import createReduxStore from './createReduxStore';
import {Provider} from 'react-redux';
import React from 'react';
import ReactDOM from 'react-dom';

const store = createReduxStore();

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  // $FlowFixMe
  document.getElementById('root')
);
