// @flow

import {connect} from 'react-redux';
import ModalManager from '../components/ModalManager';
import type {StateType} from '../reducers/types';

const mapStateToProps = (state: StateType) => ({
  type: state.modal.type,
});

export default connect(mapStateToProps)(ModalManager);
