// @flow

import InteractDoorContainer from '../containers/InteractDoorContainer';
import InteractTerminalContainer from '../containers/InteractTerminalContainer';
import React from 'react';
import ResolveEventModal from './modals/ResolveEventModal';
import StatusReinforcementContainer from '../containers/StatusReinforcementContainer';
import VictoryModal from './modals/VictoryModal';

const styles = {
  base: {},
};

type ModalManagerPropsType = {
  closeModals: Function,
  data: Object,
  type: string,
};

class ModalManager extends React.Component<ModalManagerPropsType> {
  renderModalType() {
    switch (this.props.type) {
      case 'STATUS_REINFORCEMENT':
        return <StatusReinforcementContainer />;
      case 'INTERACT_DOOR':
        return <InteractDoorContainer />;
      case 'INTERACT_TERMINAL':
        return <InteractTerminalContainer />;
      case 'RESOLVE_EVENT':
        return (
          <ResolveEventModal
            closeModals={this.props.closeModals}
            eventName={this.props.data.eventName}
          />
        );
      case 'REBEL_VICTORY':
        return <VictoryModal closeModals={this.props.closeModals} winner={'rebels'} />;
      case 'IMPERIAL_VICTORY':
        return <VictoryModal closeModals={this.props.closeModals} winner={'imperials'} />;
      default:
        return null;
    }
  }

  render() {
    return <div style={styles.base}>{this.renderModalType()}</div>;
  }
}

export default ModalManager;
