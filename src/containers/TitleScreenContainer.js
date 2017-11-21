// @flow

import {connect} from 'react-redux';
import type {StateType} from '../reducers/types';
import TitleScreen from '../components/TitleScreen';

const mapStateToProps = (state: StateType) => ({
  resumeMissionAvailable: Boolean(state.app.currentMission),
});

export default connect(mapStateToProps)(TitleScreen);
