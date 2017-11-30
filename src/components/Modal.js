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
    width: '500px',
  },
  buttonContainer: {
    ...positionAbsolute(null, 0, 20, 0),
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  contents: {
    padding: '10px',
  },
  header: {
    backgroundColor: 'black',
    color: 'white',
    padding: '10px',
  },
};

type ModalPropsType = {
  buttonText: string,
  cancelButtonText: string,
  children?: any,
  displayCancel: boolean,
  handleButtonClick: Function,
  handleCancelClick: Function,
  title: string,
};

class Modal extends React.Component<ModalPropsType> {
  static defaultProps = {
    buttonText: '',
    cancelButtonText: 'Cancel',
    displayCancel: false,
    handleButtonClick: () => {},
    handleCancelClick: () => {},
  };

  render() {
    return (
      <div style={styles.base}>
        <div style={styles.header}>{this.props.title}</div>
        <div style={styles.contents}>{this.props.children}</div>
        {this.props.buttonText ? (
          <div style={styles.buttonContainer}>
            {this.props.displayCancel ? (
              <Button onClick={this.props.handleCancelClick} text={this.props.cancelButtonText} />
            ) : null}
            <Button onClick={this.props.handleButtonClick} text={this.props.buttonText} />
          </div>
        ) : null}
      </div>
    );
  }
}

export default Modal;
