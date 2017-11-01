// @flow

import React from 'react';
import rebels from './data/rebels.json';
import UnitAvatar from './UnitAvatar';

const styles = {
  avatarContainer: {
    alignItems: 'center',
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-around',
  },
  base: {
    border: '2px solid black',
    display: 'flex',
    flexDirection: 'column',
    height: '750px',
    width: '120px',
  },
  header: {
    backgroundColor: 'black',
    color: 'white',
    padding: '5px',
  },
};

class UnitPanel extends React.Component {
  render() {
    return (
      <div style={styles.base}>
        <div style={styles.header}>Heroes</div>
        <div style={styles.avatarContainer}>
          <UnitAvatar {...rebels.diala} />
          <UnitAvatar {...rebels.jyn} />
          <UnitAvatar {...rebels.mak} />
          <UnitAvatar {...rebels.gideon} />
          <UnitAvatar {...rebels.han} />
        </div>
      </div>
    );
  }
}

export default UnitPanel;
