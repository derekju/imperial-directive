// @flow

import {setDifficulty, setExpansions, setImperialRewards, setMission, setMissionThreat} from '../reducers/app';
import CharacterSelection from '../components/CharacterSelection';
import {connect} from 'react-redux';
import missions from '../data/missions';
import {setAllyChosen, setRoster} from '../reducers/rebels';
import type {StateType} from '../reducers/types';

const mapStateToProps = (state: StateType) => ({
  availableAllies: ['chewbacca', 'han', 'luke', 'rebelSaboteur', 'rebelTrooper'],
  availableHeroes: ['biv', 'diala', 'fenn', 'gaarkhan', 'gideon', 'jyn', 'mak', 'saska'],
  availableMissions: Object.keys(missions),
});

const mapDispatchToProps = {
  setAllyChosen,
  setDifficulty,
  setExpansions,
  setImperialRewards,
  setMission,
  setMissionThreat,
  setRoster,
};

export default connect(mapStateToProps, mapDispatchToProps)(CharacterSelection);
