// @flow

import React from 'react';

const styles = {
  base: {
    border: '2px solid black',
    width: '200px',
  },
  contents: {
    fontSize: '14px',
    padding: '5px',
  },
  header: {
    backgroundColor: 'black',
    color: 'white',
    padding: '5px',
  },
};

type MissionPanelPropsType = {
  currentMission: string,
};

class MissionPanel extends React.Component<MissionPanelPropsType> {
  render() {
    return (
      <div style={styles.base}>
        <div style={styles.header}>{`Mission: ${this.props.currentMission}`}</div>
        <div style={styles.contents} />
      </div>
    );
  }
}

export default MissionPanel;
