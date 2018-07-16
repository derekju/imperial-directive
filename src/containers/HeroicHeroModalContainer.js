// @flow

import {getRosterOfType, getWithdrawnHeroes, setHeroActivateTwice} from '../reducers/rebels';
import {closeModals} from '../reducers/modal';
import {connect} from 'react-redux';
import HeroicHeroModal from '../components/modals/HeroicHeroModal';
import type {RebelUnitType} from '../reducers/rebels';
import type {StateType} from '../reducers/types';

const mapStateToProps = (state: StateType) => {
  const withdrawnHeroes = getWithdrawnHeroes(state);

  return {
    canActivateTwice: state.rebels.canActivateTwice,
    // Get roster but filter all withdrawn heroes out since they can't activate
    // Exception are the fake withdrawn heroes. They still can.
    roster: getRosterOfType(state, 'hero').filter(
      (unit: RebelUnitType) => !withdrawnHeroes.includes(unit.id)
    ),
    type: state.modal.type,
  };
};

const mapDispatchToProps = {
  closeModals,
  setHeroActivateTwice,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HeroicHeroModal);
