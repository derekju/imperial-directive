// @flow

import {IMPERIAL_BLUE, REBEL_RED} from '../styles/colors';
import React from 'react';
import upperFirst from 'lodash/upperFirst';

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
  imperialInstructionType: {
    color: IMPERIAL_BLUE,
    fontWeight: 'bold',
    marginTop: '15px',
  },
  instructions: {
    fontSize: '13px',
  },
  rebelInstructionType: {
    color: REBEL_RED,
    fontWeight: 'bold',
  },
};

type MissionPanelPropsType = {
  currentMission: string,
  instructions: {imperialVictory: string, rebelVictory: string},
};

class MissionPanel extends React.Component<MissionPanelPropsType> {
  render() {
    return (
      <div style={styles.base}>
        <div style={styles.header}>{`Mission: ${upperFirst(this.props.currentMission)}`}</div>
        <div style={styles.contents}>
          <div style={styles.rebelInstructionType}>Rebel Victory</div>
          <div style={styles.instructions}>{this.props.instructions.rebelVictory}</div>
          <div style={styles.imperialInstructionType}>Imperial Victory</div>
          <div style={styles.instructions}>{this.props.instructions.imperialVictory}</div>
        </div>
      </div>
    );
  }
}

export default MissionPanel;
