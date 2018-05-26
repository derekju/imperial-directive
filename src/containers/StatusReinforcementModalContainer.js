// @flow

import {closeModals} from '../reducers/modal';
import {connect} from 'react-redux';
import type {StateType} from '../reducers/types';
import StatusReinforcementModal from '../components/modals/StatusReinforcementModal';

const mapStateToProps = (state: StateType) => ({
  deploymentPoint: state.mission.deploymentPoint,
  groupsToReinforce: state.modal.data.groupsToReinforce,
  type: state.modal.type,
});

const mapDispatchToProps = {
  closeModals,
};

export default connect(mapStateToProps, mapDispatchToProps)(StatusReinforcementModal);
