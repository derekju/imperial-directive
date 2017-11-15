// @flow

import Modal from '../Modal';
import React from 'react';

const styles = {
  base: {
    fontWeight: 'bold',
    marginTop: '15px',
    textAlign: 'center',
  },
};

type BeginRoundModalPropsType = {
  closeModals: Function,
  currentRound: number,
  type: string,
};

class BeginRound extends React.Component<BeginRoundModalPropsType> {
  handleButtonClick = () => {
    this.props.closeModals(this.props.type);
  };

  render() {
    return (
      <Modal buttonText={'Start'} handleButtonClick={this.handleButtonClick} title="New Round">
        <div style={styles.base}>
          <span>Round {this.props.currentRound}</span>
        </div>
      </Modal>
    );
  }
}

export default BeginRound;
