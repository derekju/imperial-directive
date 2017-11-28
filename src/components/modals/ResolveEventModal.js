// @flow

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

type ResolveEventModalPropsType = {
  closeModals: Function,
  story: string,
  text: string[],
  title: string,
  type: string,
};

class ResolveEventModal extends React.Component<ResolveEventModalPropsType> {
  handleButtonClick = () => {
    this.props.closeModals(this.props.type);
  };

  render() {
    const buttonText = 'Done';
    return (
      <Modal
        buttonText={buttonText}
        handleButtonClick={this.handleButtonClick}
        title={this.props.title}
      >
        {Boolean(this.props.story) ? <div style={styles.story}>{this.props.story}</div> : null}
        {this.props.text.map((text: string, index: number) => (
          <div key={`text-${index}`} style={styles.base}>
            {text}
          </div>
        ))}
      </Modal>
    );
  }
}

export default ResolveEventModal;
