// @flow

import {defeatImperialFigure, setImperialGroupActivated} from '../reducers/imperials';
import {connect} from 'react-redux';
import ImperialDashboard from '../components/ImperialDashboard';
import {isImperialPlayerTurn} from '../reducers/mission';
import type {StateType} from '../reducers/types';

const mapStateToProps = (state: StateType) => ({
  activatedGroup: state.imperials.activatedGroup,
  deployedGroups: state.imperials.deployedGroups,
  isImperialPlayerTurn: isImperialPlayerTurn(state),
});

const mapDispatchToProps = {
  defeatImperialFigure,
  setImperialGroupActivated,
};

export default connect(mapStateToProps, mapDispatchToProps)(ImperialDashboard);
