// @flow

import Button from './Button';
import {LIGHT_WHITE} from '../styles/colors';
import {positionAbsolute} from '../styles/mixins';
import React from 'react';

const styles = {
  base: {
    backgroundColor: LIGHT_WHITE,
    border: '2px solid black',
    paddingBottom: '80px',
    position: 'relative',
    width: '400px',
  },
  buttonContainer: {
    ...positionAbsolute(null, 0, 20, 0),
    display: 'flex',
    justifyContent: 'center',
  },
  contents: {
    padding: '5px',
  },
  header: {
    backgroundColor: 'black',
    color: 'white',
    padding: '5px',
  },
};

type ModalPropsType = {
  buttonText: string,
  children?: any,
  handleButtonClick: Function,
  title: string,
};

class Modal extends React.Component<ModalPropsType> {
  render() {
    return (
      <div style={styles.base}>
        <div style={styles.header}>{this.props.title}</div>
        <div style={styles.contents}>{this.props.children}</div>
        <div style={styles.buttonContainer}>
          <Button onClick={this.props.handleButtonClick} text={this.props.buttonText} />
        </div>
      </div>
    );
  }
}

export default Modal;
