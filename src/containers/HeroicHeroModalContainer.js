// @flow

import {closeModals} from '../reducers/modal';
import {connect} from 'react-redux';
import HeroicHeroModal from '../components/modals/HeroicHeroModal';
import {getRosterOfType, setHeroActivateTwice} from '../reducers/rebels';
import type {StateType} from '../reducers/types';

const mapStateToProps = (state: StateType) => ({
  canActivateTwice: state.rebels.canActivateTwice,
  roster: getRosterOfType(state, 'hero'),
  type: state.modal.type,
});

const mapDispatchToProps = {
  closeModals,
  setHeroActivateTwice,
};

export default connect(mapStateToProps, mapDispatchToProps)(HeroicHeroModal);
