// @flow

import {connect} from 'react-redux';
import createAction from '../reducers/createAction';
import {getAftermathGoalText} from '../reducers/missions/aftermath';
import {getANewThreatGoalText} from '../reducers/missions/aNewThreat';
import {getASimpleTaskGoalText} from '../reducers/missions/aSimpleTask';
import {getBrushfireGoalText} from '../reducers/missions/brushfire';
import {getCapturedGoalText} from '../reducers/missions/captured';
import {getHighMoonGoalText} from '../reducers/missions/highMoon';
import {getImperialHospitalityGoalText} from '../reducers/missions/imperialHospitality';
import {getImpoundedGoalText} from '../reducers/missions/impounded';
import {getIndebtedGoalText} from '../reducers/missions/indebted';
import {getLooseCannonGoalText} from '../reducers/missions/looseCannon';
import {getLuxuryCruiseGoalText} from '../reducers/missions/luxuryCruise';
import {getMeansOfProductionGoalText} from '../reducers/missions/meansOfProduction';
import {getTemptationGoalText} from '../reducers/missions/temptation';
import {getUnderSiegeGoalText} from '../reducers/missions/underSiege';
import GoalPanel from '../components/GoalPanel';
import type {StateType} from '../reducers/types';

const getGoalText = (state: StateType) => {
  switch (state.app.currentMission) {
    case 'aftermath':
      return getAftermathGoalText(state);
    case 'aNewThreat':
      return getANewThreatGoalText(state);
    case 'aSimpleTask':
      return getASimpleTaskGoalText(state);
    case 'brushfire':
      return getBrushfireGoalText(state);
    case 'captured':
      return getCapturedGoalText(state);
    case 'highMoon':
      return getHighMoonGoalText(state);
    case 'imperialHospitality':
      return getImperialHospitalityGoalText(state);
    case 'impounded':
      return getImpoundedGoalText(state);
    case 'indebted':
      return getIndebtedGoalText(state);
    case 'looseCannon':
      return getLooseCannonGoalText(state);
    case 'luxuryCruise':
      return getLuxuryCruiseGoalText(state);
    case 'meansOfProduction':
      return getMeansOfProductionGoalText(state);
    case 'temptation':
      return getTemptationGoalText(state);
    case 'underSiege':
      return getUnderSiegeGoalText(state);
    default:
      return [];
  }
};

const mapStateToProps = (state: StateType) => ({
  currentMission: state.app.currentMission,
  goalText: getGoalText(state),
});

const looseCannonDefeatAtst = () => createAction('LOOSE_CANNON_DEFEAT_ATST');

const mapDispatchToProps = {
  looseCannonDefeatAtst,
};

export default connect(mapStateToProps, mapDispatchToProps)(GoalPanel);
