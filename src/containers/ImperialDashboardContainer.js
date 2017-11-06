// @flow

import {defeatImperialFigure, setImperialGroupActivated} from '../reducers/imperials';
import {connect} from 'react-redux';
import ImperialDashboard from '../components/ImperialDashboard';
import {isImperialPlayerTurn} from '../reducers/mission';

const mapStateToProps = state => ({
  activatedGroup: state.imperials.activatedGroup,
  exhaustedGroups: state.imperials.exhaustedGroups,
  isImperialPlayerTurn: isImperialPlayerTurn(state),
  readyGroups: state.imperials.readyGroups,
});

const mapDispatchToProps = {
  defeatImperialFigure,
  setImperialGroupActivated,
};

export default connect(mapStateToProps, mapDispatchToProps)(ImperialDashboard);
