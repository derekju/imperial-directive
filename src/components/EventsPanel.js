// @flow

import {ELITE_RED} from '../styles/colors';
import React from 'react';

const styles = {
  base: {
    border: '2px solid black',
    width: '200px',
  },
  contents: {
    fontSize: '14px',
    padding: '15px 5px',
    textAlign: 'center',
  },
  header: {
    backgroundColor: 'black',
    color: 'white',
    padding: '5px',
  },
  title: {
    fontWeight: 'bold',
  },
  type: {
    color: ELITE_RED,
  },
};

class EventsPanel extends React.Component<{}> {
  render() {
    return (
      <div style={styles.base}>
        <div style={styles.header}>Current Event</div>
        <div style={styles.contents}>
          <div style={styles.title}>Heavy Pressure</div>
          <br />
          <div style={styles.type}>Global</div>
          <br />
          <div>All figures in the first deployment group gain:</div>
          <br />
          <div>
            When a hero would suffer DMG from an attack by this figure, that hero suffers an equal
            amount of STRAIN instead.
          </div>
        </div>
      </div>
    );
  }
}

export default EventsPanel;
