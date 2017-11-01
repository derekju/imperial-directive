import {combineReducers, createStore} from 'redux';
import './index.css';
import App from './App';
import {Provider} from 'react-redux';
import React from 'react';
import ReactDOM from 'react-dom';
import reducers from './reducers';
import registerServiceWorker from './registerServiceWorker';

const store = createStore(combineReducers(reducers));

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);

registerServiceWorker();
