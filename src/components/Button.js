// @flow

import React from 'react';

const styles = {
  button: {
    backgroundColor: 'white',
    border: '2px solid black',
    fontWeight: 'bold',
    height: '40px',
    padding: '5px',
    textTransform: 'uppercase',
    width: '100px',
  },
};

type ButtonPropsType = {
  onClick: Function,
  text: string,
};

class Button extends React.Component<ButtonPropsType> {
  render() {
    return (
      <button style={styles.button} onClick={this.props.onClick}>
        {this.props.text}
      </button>
    );
  }
}

export default Button;
