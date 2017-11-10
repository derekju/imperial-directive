// @flow

// import Button from '../Button';
// import {positionAbsolute} from '../styles/mixins';
import Modal from '../Modal';
import React from 'react';
// TODO: Kind of dirty to reference units from here but it's not in the payload to this modal
import units from '../../data/units';

const styles = {
  base: {
    textAlign: 'center',
  },
  header: {
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 15,
  },
  units: {
    fontSize: '13px',
  },
};

type ModalPropsType = {
  closeModals: Function,
  currentThreat: number,
  groupsToDeploy: string[],
  groupsToReinforce: Array<{groupNumber: number, id: string}>,
  statusPhaseDeployReinforceDone: Function,
};

class StatusReinforcement extends React.Component<ModalPropsType> {
  handleButtonClick = () => {
    this.props.statusPhaseDeployReinforceDone(this.props.currentThreat);
    this.props.closeModals();
  };

  render() {
    return (
      <Modal
        buttonText="Units Deployed"
        handleButtonClick={this.handleButtonClick}
        title="Deployment and Reinforcement"
      >
        <div style={styles.base}>
          <div style={styles.header}>Units to deploy:</div>
          <div style={styles.units}>
            {this.props.groupsToDeploy.length
              ? this.props.groupsToDeploy.map((id: string) => units[id].name).join(', ')
              : 'None'}
          </div>
          <div style={styles.header}>Units to reinforce:</div>
          <div style={styles.units}>
            {this.props.groupsToReinforce.length
              ? this.props.groupsToReinforce
                  .map((reinforcement: Object) => {
                    return `${units[reinforcement.id].name} - Group ${reinforcement.groupNumber}`;
                  })
                  .join(', ')
              : 'None'}
          </div>
        </div>
      </Modal>
    );
  }
}

export default StatusReinforcement;
