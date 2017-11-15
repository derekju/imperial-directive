// @flow

import Modal from '../Modal';
import React from 'react';

const styles = {
  base: {
    fontSize: '14px',
    marginTop: '15px',
    textAlign: 'center',
  },
  topMargin: {
    marginTop: '10px',
  },
};

type AftermathLockdownModalPropsType = {
  closeModals: Function,
  type: string,
};

class AftermathLockdown extends React.Component<AftermathLockdownModalPropsType> {
  handleButtonClick = () => {
    this.props.closeModals(this.props.type);
  };

  render() {
    return (
      <Modal buttonText={'Close'} handleButtonClick={this.handleButtonClick} title="Lockdown">
        <div style={styles.base}>
          <div>If there is a rebel figure west of the door, choose option 1.</div>
          <div style={styles.topMargin}>Otherwise, choose option 2.</div>
        </div>
      </Modal>
    );
  }
}

export default AftermathLockdown;
