// @flow

import {setDifficulty, setMission, setMissionThreat} from '../reducers/app';
import CharacterSelection from '../components/CharacterSelection';
import {connect} from 'react-redux';
import missions from '../data/missions';
import {setAllyChosen, setRoster} from '../reducers/rebels';
import type {StateType} from '../reducers/types';

const mapStateToProps = (state: StateType) => ({
  availableAllies: ['han', 'rebelTrooper'],
  availableHeroes: ['diala', 'fenn', 'gaarkhan', 'gideon', 'jyn', 'mak'],
  availableMissions: Object.keys(missions),
});

const mapDispatchToProps = {
  setAllyChosen,
  setDifficulty,
  setMission,
  setMissionThreat,
  setRoster,
};

export default connect(mapStateToProps, mapDispatchToProps)(CharacterSelection);
