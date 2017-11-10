// @flow

import {connect} from 'react-redux';
import Mission from '../components/Mission';
import type {StateType} from '../reducers/types';

const mapStateToProps = (state: StateType) => ({
  currentMission: state.app.currentMission,
  currentRound: state.mission.currentRound,
  currentThreat: state.mission.currentThreat,
  displayModal: Boolean(state.modal.type),
});

const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(Mission);
