// @flow

import handleTextSubs from '../utils/handleTextSubs';
import Modal from '../Modal';
import React from 'react';

const styles = {
  base: {
    fontSize: '14px',
    marginTop: '15px',
    textAlign: 'center',
  },
  story: {
    fontSize: '14px',
    fontStyle: 'italic',
    marginTop: '15px',
    textAlign: 'center',
  },
};

type ChoiceModalModalPropsType = {
  choiceModalAnswer: Function,
  closeModals: Function,
  noText: string,
  question: string | string[],
  story?: string,
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
    const question = Array.isArray(this.props.question)
      ? this.props.question
      : [this.props.question];

    return (
      <Modal
        buttonText={this.props.yesText}
        cancelButtonText={this.props.noText}
        displayCancel={true}
        handleButtonClick={this.handleButtonClick}
        handleCancelClick={this.handleCancelClick}
        title={this.props.title}
      >
        {Boolean(this.props.story) ? <div style={styles.story}>{this.props.story}</div> : null}
        {question.map((q: string, index: number) => (
          <div
            key={`q-${index}`}
            style={styles.base}
            dangerouslySetInnerHTML={{__html: handleTextSubs(q)}}
          />
        ))}
      </Modal>
    );
  }
}

export default ChoiceModal;
