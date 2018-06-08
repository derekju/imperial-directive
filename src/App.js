// @flow

import {BrowserRouter as Router, Route} from 'react-router-dom';
import CharacterSelectionContainer from './containers/CharacterSelectionContainer';
import MissionContainer from './containers/MissionContainer';
import React from 'react';
import TitleScreenContainer from './containers/TitleScreenContainer';

const styles = {
  base: {
    display: 'flex',
    flex: 1,
    minHeight: '700px',
    minWidth: '1024px',
    position: 'relative',
  },
};

class App extends React.Component<{}> {
  componentDidMount() {
    window.onpopstate = event => {
      // Hack to fix going back in the browser once you're on a mission
      // Since we don't clean up any of our sagas that are running, this is the easiest way to
      // reboot the entire system
      window.location = '/';
    };
  }

  render() {
    return (
      <Router>
        <div style={styles.base}>
          <Route exact path="/" component={TitleScreenContainer} />
          <Route path="/mission" component={MissionContainer} />
          <Route path="/character_selection" component={CharacterSelectionContainer} />
        </div>
      </Router>
    );
  }
}

export default App;
