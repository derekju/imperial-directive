// @flow

import {closeModals} from '../reducers/modal';
import {connect} from 'react-redux';
import type {StateType} from '../reducers/types';
import {statusPhaseDeployReinforceDone} from '../reducers/mission';
import StatusReinforcement from '../components/modals/StatusReinforcement';

const mapStateToProps = (state: StateType) => ({
  currentThreat: state.modal.data.currentThreat,
  groupsToDeploy: state.modal.data.groupsToDeploy,
  groupsToReinforce: state.modal.data.groupsToReinforce,
  type: state.modal.data.type,
});

const mapDispatchToProps = {
  closeModals,
  statusPhaseDeployReinforceDone,
};

export default connect(mapStateToProps, mapDispatchToProps)(StatusReinforcement);
