// @flow

import {ELITE_RED} from '../../styles/colors';
import React from 'react';

const styles = {
  base: {
    alignItems: 'center',
    backgroundColor: ELITE_RED,
    border: '2px solid black',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    height: '25px',
    justifyContent: 'center',
    position: 'relative',
    width: '25px',
  },
};

type TerminalPropsType = {
  id: string,
};

class Terminal extends React.Component<TerminalPropsType> {
  render() {
    return (
      <div style={styles.base}>
        <span>{`T${this.props.id}`}</span>
      </div>
    );
  }
}

export default Terminal;
