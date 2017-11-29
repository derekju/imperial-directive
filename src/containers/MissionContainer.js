// @flow

import {getAftermathGoalText} from '../reducers/missions/aftermath';
import {getANewThreatGoalText} from '../reducers/missions/aNewThreat';
import {getASimpleTaskGoalText} from '../reducers/missions/aSimpleTask';
import {getLuxuryCruiseGoalText} from '../reducers/missions/luxuryCruise';
import {setImperialGroupActivated, setInterruptedGroupActivated} from '../reducers/imperials';
import {connect} from 'react-redux';
import Mission from '../components/Mission';
import missions from '../data/missions';
import type {StateType} from '../reducers/types';

const getGoalText = (state: StateType) => {
  switch (state.app.currentMission) {
    case 'aftermath':
      return getAftermathGoalText(state);
    case 'aNewThreat':
      return getANewThreatGoalText(state);
    case 'aSimpleTask':
      return getASimpleTaskGoalText(state);
    case 'luxuryCruise':
      return getLuxuryCruiseGoalText(state);
    default:
      return [];
  }
};

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
  goalText: getGoalText(state),
  instructions: state.mission.instructions,
  interruptedGroup: state.imperials.interruptedGroup,
  moveTarget: state.mission.moveTarget,
});

const mapDispatchToProps = {
  setImperialGroupActivated,
  setInterruptedGroupActivated,
};

export default connect(mapStateToProps, mapDispatchToProps)(Mission);
