// @flow

import {connect} from 'react-redux';
import HeroPanel from '../components/HeroPanel';
import {isRebelPlayerTurn} from '../reducers/mission';
import {setRebelHeroActivated} from '../reducers/rebels';
import type {StateType} from '../reducers/types';

const mapStateToProps = (state: StateType) => ({
  activatedRebels: state.rebels.activatedRebels,
  isRebelPlayerTurn: isRebelPlayerTurn(state),
  roster: state.rebels.roster,
});

const mapDispatchToProps = {
  setRebelHeroActivated,
};

export default connect(mapStateToProps, mapDispatchToProps)(HeroPanel);
