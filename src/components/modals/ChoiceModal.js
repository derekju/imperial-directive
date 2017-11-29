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

type ChoiceModalModalPropsType = {
  choiceModalAnswer: Function,
  closeModals: Function,
  noText: string,
  question: string,
  title: string,
  type: string,
  yesText: string,
};

class ChoiceModal extends React.Component<ChoiceModalModalPropsType> {
  static defaultProps = {
    noText: 'No',
    yesText: 'Yes',
  };

  handleButtonClick = () => {
    this.props.closeModals(this.props.type);
    this.props.choiceModalAnswer('yes');
  };

  handleCancelClick = () => {
    this.props.closeModals(this.props.type);
    this.props.choiceModalAnswer('no');
  };

  render() {
    return (
      <Modal
        buttonText={this.props.yesText}
        cancelButtonText={this.props.noText}
        displayCancel={true}
        handleButtonClick={this.handleButtonClick}
        handleCancelClick={this.handleCancelClick}
        title={this.props.title}
      >
        <div style={styles.base}>{this.props.question}</div>
      </Modal>
    );
  }
}

export default ChoiceModal;
