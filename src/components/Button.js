// @flow

import React from 'react';

const styles = {
  button: {
    backgroundColor: 'white',
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
    };

    return (
      <button style={buttonStyles} onClick={this.props.onClick}>
        {this.props.text}
      </button>
    );
  }
}

export default Button;
