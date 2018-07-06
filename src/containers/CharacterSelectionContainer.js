// @flow

import {setAllyChosen, setRoster} from '../reducers/rebels';
import {
  setDifficulty,
  setExpansions,
  setImperialRewards,
  setMission,
  setMissionThreat,
} from '../reducers/app';
import CharacterSelection from '../components/CharacterSelection';
import {connect} from 'react-redux';
import missions from '../data/missions';
import {setVillains} from '../reducers/imperials';
import type {StateType} from '../reducers/types';

const mapStateToProps = (state: StateType) => {
  const coreMissions = Object.keys(missions).reduce((accumulator: string[], missionKey: string) => {
    if (missions[missionKey].wave === undefined) {
      accumulator.push(missionKey);
    }
    return accumulator;
  }, []);
  const wave1Missions = Object.keys(missions).reduce(
    (accumulator: string[], missionKey: string) => {
      if (missions[missionKey].wave === 'wave1') {
        accumulator.push(missionKey);
      }
      return accumulator;
    },
    []
  );
  const twinShadowsMissions = Object.keys(missions).reduce(
    (accumulator: string[], missionKey: string) => {
      if (missions[missionKey].wave === 'twinShadows') {
        accumulator.push(missionKey);
      }
      return accumulator;
    },
    []
  );

  return {
    availableAllies: ['chewbacca', 'han', 'luke', 'rebelSaboteur', 'rebelTrooper'],
    availableHeroes: ['biv', 'diala', 'fenn', 'gaarkhan', 'gideon', 'jyn', 'mak', 'saska'],
    availableMissions: ['--- CORE ---']
      .concat(coreMissions)
      .concat(['--- WAVE 1 ---'])
      .concat(wave1Missions)
      .concat(['--- TWIN SHADOWS ---'])
      .concat(twinShadowsMissions),
    availableVillains: ['darthVader', 'generalWeiss', 'ig88', 'royalGuardChampion'],
  };
};

const mapDispatchToProps = {
  setAllyChosen,
  setDifficulty,
  setExpansions,
  setImperialRewards,
  setMission,
  setMissionThreat,
  setRoster,
  setVillains,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CharacterSelection);
