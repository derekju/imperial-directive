// @flow

import {connect} from 'react-redux';
import HeroPanel from '../components/HeroPanel';
import {isRebelPlayerTurn} from '../reducers/mission';
import {setRebelHeroActivated} from '../reducers/rebels';

const mapStateToProps = state => ({
  activatedRebels: state.rebels.activatedRebels,
  isRebelPlayerTurn: isRebelPlayerTurn(state),
  roster: state.rebels.roster,
});

const mapDispatchToProps = {
  setRebelHeroActivated,
};

export default connect(mapStateToProps, mapDispatchToProps)(HeroPanel);
