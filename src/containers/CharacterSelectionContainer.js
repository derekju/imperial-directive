// @flow

import {setAllyChosen, setRoster} from '../reducers/rebels';
import {
  setDifficulty,
  setExpansions,
  setImperialRewards,
  setMission,
  setMissionThreat,
  setThreatReduction,
} from '../reducers/app';
import CharacterSelection from '../components/CharacterSelection';
import {connect} from 'react-redux';
import filter from 'lodash/filter';
import missions from '../data/missions';
import type {RebelConfigType} from '../reducers/rebels';
import rebels from '../data/rebels.json';
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
  const returnToHothMissions = Object.keys(missions).reduce(
    (accumulator: string[], missionKey: string) => {
      if (missions[missionKey].wave === 'returnToHoth') {
        accumulator.push(missionKey);
      }
      return accumulator;
    },
    []
  );

  return {
    availableAllies: filter(rebels, (rebel: RebelConfigType) => rebel.type === 'ally').map(
      (rebel: RebelConfigType) => rebel.id
    ),
    availableHeroes: filter(rebels, (rebel: RebelConfigType) => rebel.type === 'hero').map(
      (rebel: RebelConfigType) => rebel.id
    ),
    availableMissions: ['--- CORE ---']
      .concat(coreMissions)
      .concat(['--- WAVE 1 ---'])
      .concat(wave1Missions)
      .concat(['--- TWIN SHADOWS ---'])
      .concat(twinShadowsMissions)
      .concat(['--- RETURN TO HOTH ---'])
      .concat(returnToHothMissions),
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
  setThreatReduction,
  setVillains,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CharacterSelection);
