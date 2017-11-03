// @flow

import {connect} from 'react-redux';
import ImperialDashboard from '../components/ImperialDashboard';

const mapStateToProps = state => ({
  readyGroups: state.imperials.readyGroups,
});

const mapDispatchToProps = {};

export default connect(mapStateToProps)(ImperialDashboard);
