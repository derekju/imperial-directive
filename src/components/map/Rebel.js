// @flow

import {positionAbsolute} from '../../styles/mixins';
import React from 'react';
import {REBEL_RED} from '../../styles/colors';

const styles = {
  activated: {
    opacity: 0.25,
  },
  base: {
    alignItems: 'center',
    backgroundColor: REBEL_RED,
    border: '2px solid black',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    height: '25px',
    justifyContent: 'center',
    width: '25px',
  },
  offset: {
    ...positionAbsolute(32, null, null, 32),
    zIndex: 1,
  },
};

type RebelPropsType = {
  activated: boolean,
  displayModal: Function,
  id: string,
  offset: boolean,
  type: string,
};

class Rebel extends React.Component<RebelPropsType> {
  handleClick = () => {
    this.props.displayModal('INTERACT_OBJECT', {id: this.props.id, type: this.props.type});
  };

  render() {
    const combinedStyles = {
      ...styles.base,
      ...(this.props.activated ? styles.activated : {}),
      ...(this.props.offset ? styles.offset : {}),
    };

    return (
      <div style={combinedStyles} onClick={this.handleClick}>
        <span>{`R${this.props.id}`}</span>
      </div>
    );
  }
}

export default Rebel;
