// @flow

import {connect} from 'react-redux';
import Mission from '../components/Mission';
import {setImperialGroupActivated} from '../reducers/imperials';
import type {StateType} from '../reducers/types';

const mapStateToProps = (state: StateType) => ({
  activatedGroup: state.imperials.activatedGroup,
  currentMission: state.app.currentMission,
  currentRound: state.mission.currentRound,
  currentThreat: state.mission.currentThreat,
  displayModal: Boolean(state.modal.type),
  instructions: state.mission.instructions,
});

const mapDispatchToProps = {
  setImperialGroupActivated,
};

export default connect(mapStateToProps, mapDispatchToProps)(Mission);
