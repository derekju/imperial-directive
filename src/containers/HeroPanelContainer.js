// @flow

import {setRebelEscaped, setRebelHeroActivated, woundRebelHero} from '../reducers/rebels';
import {connect} from 'react-redux';
import HeroPanel from '../components/HeroPanel';
import {isRebelPlayerTurn} from '../reducers/mission';
import type {StateType} from '../reducers/types';

const mapStateToProps = (state: StateType) => ({
  activatedRebels: state.rebels.activatedRebels,
  canActivateTwice: state.rebels.canActivateTwice,
  isRebelPlayerTurn: isRebelPlayerTurn(state),
  roster: state.rebels.roster,
  withdrawnHeroes: state.rebels.withdrawnHeroes,
  woundedHeroes: state.rebels.woundedHeroes,
});

const mapDispatchToProps = {
  setRebelEscaped,
  setRebelHeroActivated,
  woundRebelHero,
};

export default connect(mapStateToProps, mapDispatchToProps)(HeroPanel);
