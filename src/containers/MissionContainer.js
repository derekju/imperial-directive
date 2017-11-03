// @flow

import {connect} from 'react-redux';
import Mission from '../components/Mission';

const mapStateToProps = state => ({
  currentRound: state.mission.currentRound,
  currentThreat: state.mission.currentThreat,
  missionStep: state.mission.step,
});

const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(Mission);
