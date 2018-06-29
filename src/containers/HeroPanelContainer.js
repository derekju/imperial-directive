// @flow

import {
  setRebelActivated,
  setRebelEscaped,
  woundRebelHero,
  woundRebelOther,
} from '../reducers/rebels';
import {connect} from 'react-redux';
import HeroPanel from '../components/HeroPanel';
import {isRebelPlayerTurn} from '../reducers/mission';
import type {StateType} from '../reducers/types';

const mapStateToProps = (state: StateType) => ({
  activatedRebels: state.rebels.activatedRebels,
  canActivateTwice: state.rebels.canActivateTwice,
  canIncapacitate: state.rebels.canIncapacitate,
  enableEscape: state.rebels.enableEscape,
  fakeWithdrawnHeroes: state.rebels.fakeWithdrawnHeroes,
  hpBoosts: state.rebels.hpBoosts,
  isRebelPlayerTurn: isRebelPlayerTurn(state),
  roster: state.rebels.roster,
  withdrawnHeroCanActivate: state.mission.withdrawnHeroCanActivate,
  withdrawnHeroes: state.rebels.withdrawnHeroes,
  woundedHeroes: state.rebels.woundedHeroes,
});

const mapDispatchToProps = {
  setRebelActivated,
  setRebelEscaped,
  woundRebelHero,
  woundRebelOther,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HeroPanel);
