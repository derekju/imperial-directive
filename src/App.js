// @flow

import MissionContainer from './containers/MissionContainer';
import React from 'react';

const styles = {
  base: {
    alignItems: 'center',
    backgroundColor: '#333',
    display: 'flex',
    height: '100%',
    justifyContent: 'center',
  },
};

class App extends React.Component<{}> {
  render() {
    return (
      <div style={styles.base}>
        <MissionContainer />
      </div>
    );
  }
}

export default App;
