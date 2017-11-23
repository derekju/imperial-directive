// @flow

import React from 'react';

const styles = {
  activated: {
    opacity: 0.25,
  },
  base: {
    alignItems: 'center',
    backgroundColor: '#DDD',
    border: '2px solid white',
    color: 'black',
    cursor: 'pointer',
    display: 'flex',
    height: '25px',
    justifyContent: 'center',
    position: 'relative',
    width: '25px',
  },
};

type NeutralPropsType = {
  activated: boolean,
  displayModal: Function,
  id: string,
  type: string,
};

class Neutral extends React.Component<NeutralPropsType> {
  handleClick = () => {
    this.props.displayModal('INTERACT_NEUTRAL', {id: this.props.id, type: this.props.type});
  };

  render() {
    const combinedStyles = {
      ...styles.base,
      ...(this.props.activated ? styles.activated : {}),
    };

    return (
      <div style={combinedStyles} onClick={this.handleClick}>
        <span>{`N${this.props.id}`}</span>
      </div>
    );
  }
}

export default Neutral;
