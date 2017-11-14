// @flow

import {ELITE_RED} from '../../styles/colors';
import React from 'react';

const styles = {
  activated: {
    opacity: 0.25,
  },
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
  activated: boolean,
  displayModal: Function,
  id: string,
  type: string,
};

class Terminal extends React.Component<TerminalPropsType> {
  handleClick = () => {
    this.props.displayModal('INTERACT_TERMINAL', {id: this.props.id, type: this.props.type});
  };

  render() {
    const combinedStyles = {
      ...styles.base,
      ...(this.props.activated ? styles.activated : {}),
    };

    return (
      <div style={combinedStyles} onClick={this.handleClick}>
        <span>{`T${this.props.id}`}</span>
      </div>
    );
  }
}

export default Terminal;
