// @flow

import Circle from '../Circle';
import Modal from '../Modal';
import React from 'react';

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

type StatusReinforcementModalPropsType = {
  closeModals: Function,
  deploymentPoint: string,
  groupsToReinforce: Array<{
    alias: {color: string, number: number},
    groupNumber: number,
    id: string,
    name: string,
  }>,
  type: string,
};

class StatusReinforcementModal extends React.Component<StatusReinforcementModalPropsType> {
  handleButtonClick = () => {
    this.props.closeModals(this.props.type);
  };

  render() {
    return (
      <Modal
        buttonText="Units Deployed"
        handleButtonClick={this.handleButtonClick}
        title="Reinforcement"
      >
        <div style={styles.base}>
          <div>
            <div style={styles.header}>Location to deploy:</div>
            <div style={styles.units}>{this.props.deploymentPoint}</div>
          </div>
          <div style={styles.header}>Units to reinforce:</div>
          <div style={styles.units}>
            {this.props.groupsToReinforce.length
              ? this.props.groupsToReinforce.map(
                  (
                    reinforcement: {
                      alias: {color: string, number: number},
                      groupNumber: number,
                      id: string,
                      name: string,
                    },
                    index: number
                  ) => (
                    <div key={`${reinforcement.id}-${index}`}>
                      {reinforcement.name}
                      <Circle
                        color={reinforcement.alias.color}
                        number={reinforcement.alias.number}
                        useSmallSize={true}
                      />
                    </div>
                  )
                )
              : 'None'}
          </div>
        </div>
      </Modal>
    );
  }
}

export default StatusReinforcementModal;
