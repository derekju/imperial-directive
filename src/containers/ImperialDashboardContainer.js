// @flow

import {connect} from 'react-redux';
import ImperialDashboard from '../components/ImperialDashboard';
import {setImperialGroupActivated} from '../reducers/imperials';

const mapStateToProps = state => ({
  activatedGroups: state.imperials.activatedGroups,
  exhaustedGroups: state.imperials.exhaustedGroups,
  readyGroups: state.imperials.readyGroups,
});

const mapDispatchToProps = {
  setImperialGroupActivated,
};

export default connect(mapStateToProps, mapDispatchToProps)(ImperialDashboard);
