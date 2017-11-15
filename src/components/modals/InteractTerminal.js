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

type InteractTerminalPropsType = {
  closeModals: Function,
  mapState: MapStateType,
  setMapStateActivated: Function,
  type: string,
};

class InteractTerminal extends React.Component<InteractTerminalPropsType> {
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
    const buttonText = this.props.mapState.activated ? 'Restore terminal' : 'Destroy terminal';
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

export default InteractTerminal;
