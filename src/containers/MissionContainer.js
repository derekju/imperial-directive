// @flow

import {connect} from 'react-redux';
import Mission from '../components/Mission';
import missions from '../data/missions';
import {setImperialGroupActivated} from '../reducers/imperials';
import type {StateType} from '../reducers/types';

const mapStateToProps = (state: StateType) => ({
  activatedGroup: state.imperials.activatedGroup,
  currentMission: state.app.currentMission,
  currentMissionName: missions[state.app.currentMission].name || '',
  currentRound: state.mission.currentRound,
  currentThreat: state.mission.currentThreat,
  displayModal: Boolean(state.modal.type),
  instructions: state.mission.instructions,
  priorityTarget: state.mission.priorityTarget,
});

const mapDispatchToProps = {
  setImperialGroupActivated,
};

export default connect(mapStateToProps, mapDispatchToProps)(Mission);
