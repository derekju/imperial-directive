// @flow

import {connect} from 'react-redux';
import {displayModal} from '../reducers/modal';
import Map from '../components/Map';
import type {StateType} from '../reducers/types';

const mapStateToProps = (state: StateType) => ({
  mapImage: state.mission.mapImage,
  mapStates: state.mission.mapStates,
});

const mapDispatchToProps = {
  displayModal,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Map);
