// @flow

import {setImperialGroupActivated, setInterruptedGroupActivated} from '../reducers/imperials';
import {connect} from 'react-redux';
import Mission from '../components/Mission';
import missions from '../data/missions';
import type {StateType} from '../reducers/types';

const mapStateToProps = (state: StateType) => ({
  activatedGroup: state.imperials.activatedGroup,
  attackTarget: state.mission.attackTarget,
  currentMission: state.app.currentMission,
  currentMissionName: missions[state.app.currentMission]
    ? missions[state.app.currentMission].name
    : '',
  currentRound: state.mission.currentRound,
  currentThreat: state.mission.currentThreat,
  displayModal: Boolean(state.modal.type),
  instructions: state.mission.instructions,
  interruptedGroup: state.imperials.interruptedGroup,
  moveTarget: state.mission.moveTarget,
});

const mapDispatchToProps = {
  setImperialGroupActivated,
  setInterruptedGroupActivated,
};

export default connect(mapStateToProps, mapDispatchToProps)(Mission);
