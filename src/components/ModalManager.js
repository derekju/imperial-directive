// @flow

import BeginRoundModal from './modals/BeginRoundModal';
import ChoiceModal from './modals/ChoiceModal';
import HeroicHeroModalContainer from '../containers/HeroicHeroModalContainer';
import InteractObjectContainer from '../containers/InteractObjectContainer';
import NewEventModal from './modals/NewEventModal';
import React from 'react';
import ResolveEventModal from './modals/ResolveEventModal';
import StatusReinforcementModalContainer from '../containers/StatusReinforcementModalContainer';
import VictoryModal from './modals/VictoryModal';

type ModalManagerPropsType = {
  choiceModalAnswer: Function,
  closeModals: Function,
  data: Object,
  type: string,
};

class ModalManager extends React.Component<ModalManagerPropsType> {
  renderModalType() {
    switch (this.props.type) {
      case 'BEGIN_ROUND':
        return (
          <BeginRoundModal
            closeModals={this.props.closeModals}
            currentRound={this.props.data.currentRound}
            type={this.props.type}
          />
        );
      case 'CHOICE_MODAL':
        return (
          <ChoiceModal
            choiceModalAnswer={this.props.choiceModalAnswer}
            closeModals={this.props.closeModals}
            noText={this.props.data.noText}
            question={this.props.data.question}
            title={this.props.data.title}
            type={this.props.type}
            yesText={this.props.data.yesText}
          />
        );
      case 'HEROIC_HERO_MODAL':
        return <HeroicHeroModalContainer />;
      case 'IMPERIAL_VICTORY':
        return (
          <VictoryModal
            closeModals={this.props.closeModals}
            type={this.props.type}
            winner={'imperials'}
          />
        );
      case 'INTERACT_OBJECT':
        return <InteractObjectContainer />;
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
            story={this.props.data.story || ''}
            text={this.props.data.text}
            title={this.props.data.title}
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
        return <StatusReinforcementModalContainer />;
      default:
        return null;
    }
  }

  render() {
    return <div>{this.renderModalType()}</div>;
  }
}

export default ModalManager;
