// @flow

import './Button.css';
import React from 'react';

const styles = {
  button: {
    border: '2px solid black',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    height: '40px',
    padding: '5px',
    textTransform: 'uppercase',
    width: '150px',
  },
};

type ButtonPropsType = {
  onClick: Function,
  style?: Object,
  text: string,
  width?: number,
};

class Button extends React.Component<ButtonPropsType> {
  static defaultProps = {
    onClick: () => {},
  };

  render() {
    const buttonStyles = {
      ...styles.button,
      ...(this.props.width ? {width: `${this.props.width}px`} : {}),
      ...(this.props.style || {}),
    };

    return (
      <button className="Button" style={buttonStyles} onClick={this.props.onClick}>
        {this.props.text}
      </button>
    );
  }
}

export default Button;
