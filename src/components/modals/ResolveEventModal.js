// @flow

import Modal from '../Modal';
import React from 'react';

const styles = {
  base: {
    fontSize: '14px',
    marginTop: '15px',
    textAlign: 'center',
  },
};

type ResolveEventModalPropsType = {
  closeModals: Function,
  text: string[],
  type: string,
};

class ResolveEventModal extends React.Component<ResolveEventModalPropsType> {
  handleButtonClick = () => {
    this.props.closeModals(this.props.type);
  };

  render() {
    const buttonText = 'Done';
    return (
      <Modal buttonText={buttonText} handleButtonClick={this.handleButtonClick} title="Event">
        {this.props.text.map((text: string, index: number) => (
          <div key={`text-${index}`} style={styles.base}>{text}</div>
        ))}
      </Modal>
    );
  }
}

export default ResolveEventModal;
