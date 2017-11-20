// @flow

import CharacterSelection from '../components/CharacterSelection';
import {connect} from 'react-redux';
import {setRoster} from '../reducers/rebels';
import type {StateType} from '../reducers/types';

const mapStateToProps = (state: StateType) => ({
  availableHeroes: ['diala', 'fenn', 'gaarkhan', 'gideon', 'jyn', 'mak'],
});

const mapDispatchToProps = {
  setRoster,
};

export default connect(mapStateToProps, mapDispatchToProps)(CharacterSelection);
