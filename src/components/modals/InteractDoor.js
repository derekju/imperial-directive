// @flow

import type {MapStateType} from '../../reducers/mission';
import Modal from '../Modal';
import React from 'react';

const styles = {
  base: {
    fontStyle: 'italic',
    marginTop: '15px',
    textAlign: 'center',
  },
};

type InteractDoorPropsType = {
  closeModals: Function,
  mapState: MapStateType,
  setMapStateActivated: Function,
  type: string,
};

class InteractDoor extends React.Component<InteractDoorPropsType> {
  handleButtonClick = () => {
    this.props.closeModals(this.props.type);
    this.props.setMapStateActivated(
      this.props.mapState.id,
      this.props.mapState.type,
      !this.props.mapState.activated
    );
  };

  handleCancelClick = () => {
    this.props.closeModals(this.props.type);
  };

  render() {
    const buttonText = this.props.mapState.activated ? 'Close door' : 'Open door';
    return (
      <Modal
        buttonText={buttonText}
        displayCancel={true}
        handleButtonClick={this.handleButtonClick}
        handleCancelClick={this.handleCancelClick}
        title="Interact"
      >
        <div style={styles.base}>{this.props.mapState.description}</div>
      </Modal>
    );
  }
}

export default InteractDoor;
