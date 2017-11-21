// @flow

import CharacterSelection from '../components/CharacterSelection';
import {connect} from 'react-redux';
import {setMission} from '../reducers/app';
import {setRoster} from '../reducers/rebels';
import type {StateType} from '../reducers/types';

const mapStateToProps = (state: StateType) => ({
  availableHeroes: ['diala', 'fenn', 'gaarkhan', 'gideon', 'jyn', 'mak'],
  availableMissions: ['aftermath'],
});

const mapDispatchToProps = {
  setMission,
  setRoster,
};

export default connect(mapStateToProps, mapDispatchToProps)(CharacterSelection);
