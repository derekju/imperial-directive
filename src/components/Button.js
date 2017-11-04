// @flow

import {LIGHT_WHITE} from '../styles/colors';
import React from 'react';

const styles = {
  button: {
    backgroundColor: LIGHT_WHITE,
    border: '2px solid black',
    cursor: 'pointer',
    fontWeight: 'bold',
    height: '40px',
    padding: '5px',
    textTransform: 'uppercase',
    width: '125px',
  },
};

type ButtonPropsType = {
  onClick: Function,
  text: string,
};

class Button extends React.Component<ButtonPropsType> {
  static defaultProps = {
    onClick: () => {},
  };

  render() {
    return (
      <button style={styles.button} onClick={this.props.onClick}>
        {this.props.text}
      </button>
    );
  }
}

export default Button;
