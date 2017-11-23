// @flow

import AftermathLockdownModal from './modals/AftermathLockdownModal';
import BeginRoundModal from './modals/BeginRoundModal';
import InteractDoorContainer from '../containers/InteractDoorContainer';
import InteractTerminalContainer from '../containers/InteractTerminalContainer';
import MissionInstructionsModal from './modals/MissionInstructionsModal';
import NewEventModal from './modals/NewEventModal';
import React from 'react';
import ResolveEventModal from './modals/ResolveEventModal';
import StatusReinforcementModal from './modals/StatusReinforcementModal';
import VictoryModal from './modals/VictoryModal';

type ModalManagerPropsType = {
  closeModals: Function,
  data: Object,
  type: string,
};

class ModalManager extends React.Component<ModalManagerPropsType> {
  renderModalType() {
    switch (this.props.type) {
      case 'AFTERMATH_LOCKDOWN':
        return (
          <AftermathLockdownModal closeModals={this.props.closeModals} type={this.props.type} />
        );
      case 'BEGIN_ROUND':
        return (
          <BeginRoundModal
            closeModals={this.props.closeModals}
            currentRound={this.props.data.currentRound}
            type={this.props.type}
          />
        );
      case 'IMPERIAL_VICTORY':
        return (
          <VictoryModal
            closeModals={this.props.closeModals}
            type={this.props.type}
            winner={'imperials'}
          />
        );
      case 'INTERACT_DOOR':
        return <InteractDoorContainer />;
      case 'INTERACT_TERMINAL':
        return <InteractTerminalContainer />;
      case 'MISSION_INSTRUCTIONS':
        return (
          <MissionInstructionsModal closeModals={this.props.closeModals} type={this.props.type} />
        );
      case 'NEW_EVENT_MODAL':
        return (
          <NewEventModal
            closeModals={this.props.closeModals}
            event={this.props.data.event}
            type={this.props.type}
          />
        );
      case 'RESOLVE_EVENT':
        return (
          <ResolveEventModal
            closeModals={this.props.closeModals}
            eventName={this.props.data.eventName}
            type={this.props.type}
          />
        );
      case 'REBEL_VICTORY':
        return (
          <VictoryModal
            closeModals={this.props.closeModals}
            type={this.props.type}
            winner={'rebels'}
          />
        );
      case 'STATUS_REINFORCEMENT':
        return (
          <StatusReinforcementModal
            closeModals={this.props.closeModals}
            groupsToDeploy={this.props.data.groupsToDeploy}
            groupsToReinforce={this.props.data.groupsToReinforce}
            type={this.props.type}
          />
        );
      default:
        return null;
    }
  }

  render() {
    return <div>{this.renderModalType()}</div>;
  }
}

export default ModalManager;
