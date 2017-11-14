// @flow

import imperialPng from '../../assets/icons/imperial.png';
import Modal from '../Modal';
import React from 'react';
import rebelPng from '../../assets/icons/rebel.png';

const styles = {
  base: {
    fontWeight: 'bold',
    marginTop: '15px',
    textAlign: 'center',
  },
  image: {
    height: '93px',
    marginBottom: '10px',
    width: '90px',
  },
};

type VictoryModalPropsType = {
  closeModals: Function,
  winner: 'rebels' | 'imperials',
};

class VictoryModal extends React.Component<VictoryModalPropsType> {
  handleButtonClick = () => {
    this.props.closeModals();
  };

  render() {
    const title = this.props.winner === 'rebels' ? 'Rebel Victory' : 'Imperial Victory';
    return (
      <Modal buttonText={'Close'} handleButtonClick={this.handleButtonClick} title={title}>
        <div style={styles.base}>
          {this.props.winner === 'rebels' ? (
            <img alt="Rebels" src={rebelPng} style={styles.image} />
          ) : (
            <img alt="Imperials" src={imperialPng} style={styles.image} />
          )}
          {this.props.winner === 'rebels' ? (
            <div>Congratulations! The rebels have won!</div>
          ) : (
            <div>Unfortunately, the imperials crushed the rebel scum.</div>
          )}
        </div>
      </Modal>
    );
  }
}

export default VictoryModal;
