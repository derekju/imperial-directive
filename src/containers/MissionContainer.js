// @flow

import {connect} from 'react-redux';
import Mission from '../components/Mission';

const mapStateToProps = state => ({
  missionStep: state.missionGameState.step,
});

export default connect(mapStateToProps)(Mission);
