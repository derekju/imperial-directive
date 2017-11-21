// @flow

import {activateImperialGroup, defeatImperialFigure} from '../reducers/imperials';
import {connect} from 'react-redux';
import ImperialDashboard from '../components/ImperialDashboard';
import {isImperialPlayerTurn} from '../reducers/mission';
import type {StateType} from '../reducers/types';

const mapStateToProps = (state: StateType) => ({
  deployedGroups: state.imperials.deployedGroups,
  isImperialPlayerTurn: isImperialPlayerTurn(state),
});

const mapDispatchToProps = {
  activateImperialGroup,
  defeatImperialFigure,
};

export default connect(mapStateToProps, mapDispatchToProps)(ImperialDashboard);
