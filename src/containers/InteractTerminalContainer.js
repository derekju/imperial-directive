// @flow

import {closeModals} from '../reducers/modal';
import {connect} from 'react-redux';
import InteractTerminal from '../components/modals/InteractTerminal';
import {setMapStateActivated} from '../reducers/mission';
import type {StateType} from '../reducers/types';

const mapStateToProps = (state: StateType) => ({
  id: state.modal.data.id,
  mapState: state.mission.mapStates[`${state.modal.data.type}-${state.modal.data.id}`],
  type: state.modal.data.type,
});

const mapDispatchToProps = {
  closeModals,
  setMapStateActivated,
};

export default connect(mapStateToProps, mapDispatchToProps)(InteractTerminal);
