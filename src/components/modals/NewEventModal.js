// @flow

import type {EventType} from '../../reducers/events';
import Modal from '../Modal';
import React from 'react';

const styles = {
  base: {
    fontWeight: 'bold',
    marginTop: '15px',
    textAlign: 'center',
  },
};

type NewEventModalPropsType = {
  closeModals: Function,
  event: EventType,
  type: string,
};

class NewEventModal extends React.Component<NewEventModalPropsType> {
  handleButtonClick = () => {
    this.props.closeModals(this.props.type);
  };

  render() {
    return (
      <Modal buttonText="Close" handleButtonClick={this.handleButtonClick} title="Current Event">
        <div style={styles.base}>
          <span>{this.props.event.name}</span>
        </div>
      </Modal>
    );
  }
}

export default NewEventModal;
