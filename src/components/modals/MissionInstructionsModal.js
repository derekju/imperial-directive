// @flow

import Modal from '../Modal';
import React from 'react';

const styles = {
  base: {
    fontSize: '13px',
    marginTop: '15px',
    textAlign: 'center',
  },
};

type MissionInstructionsModalPropsType = {
  closeModals: Function,
  type: string,
};

class BeginRound extends React.Component<MissionInstructionsModalPropsType> {
  handleButtonClick = () => {
    this.props.closeModals(this.props.type);
  };

  render() {
    return (
      <Modal buttonText={'OK'} handleButtonClick={this.handleButtonClick} title="Mission Setup">
        <div style={styles.base}>
          <div>Setup the mission map according to the campaign guide.</div>
          <br />
          <div>Read the deployment and setup section and add the figures to the map as specified.</div>
          <br />
          <div>Read the Mission Briefing and nothing else!</div>
        </div>
      </Modal>
    );
  }
}

export default BeginRound;
