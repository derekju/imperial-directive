// @flow

import {BrowserRouter as Router, Route} from 'react-router-dom';
import MissionContainer from './containers/MissionContainer';
import React from 'react';
import TitleScreen from './components/TitleScreen';

const styles = {
  base: {
    alignItems: 'center',
    backgroundColor: '#333',
    display: 'flex',
    height: '100%',
    justifyContent: 'center',
  },
  canvas: {
    height: '768px',
    width: '1024px',
  },
};

class App extends React.Component<{}> {
  render() {
    return (
      <Router>
        <div style={styles.base}>
          <div style={styles.canvas}>
            <Route exact path="/" component={TitleScreen} />
            <Route path="/mission" component={MissionContainer} />
          </div>
        </div>
      </Router>
    );
  }
}

export default App;
