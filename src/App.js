// @flow

import CharacterSelectionContainer from './containers/CharacterSelectionContainer';
import {ConnectedRouter} from 'connected-react-router';
import MissionContainer from './containers/MissionContainer';
import React from 'react';
import {Route} from 'react-router-dom';
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

type AppPropsType = {
  history: Object,
};

class App extends React.Component<AppPropsType> {
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
      <ConnectedRouter history={this.props.history}>
        <div style={styles.base}>
          <Route exact path="/" component={TitleScreenContainer} />
          <Route path="/mission/:missionId" component={MissionContainer} />
          <Route path="/character_selection" component={CharacterSelectionContainer} />
        </div>
      </ConnectedRouter>
    );
  }
}

export default App;
