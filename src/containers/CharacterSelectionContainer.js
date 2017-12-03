// @flow

import {setDifficulty, setMission, setMissionThreat} from '../reducers/app';
import CharacterSelection from '../components/CharacterSelection';
import {connect} from 'react-redux';
import missions from '../data/missions';
import {setRoster} from '../reducers/rebels';
import type {StateType} from '../reducers/types';

const mapStateToProps = (state: StateType) => ({
  availableHeroes: ['diala', 'fenn', 'gaarkhan', 'gideon', 'jyn', 'mak'],
  availableMissions: Object.keys(missions),
});

const mapDispatchToProps = {
  setDifficulty,
  setMission,
  setMissionThreat,
  setRoster,
};

export default connect(mapStateToProps, mapDispatchToProps)(CharacterSelection);
