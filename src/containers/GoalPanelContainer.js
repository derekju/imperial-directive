// @flow

import {connect} from 'react-redux';
import createAction from '../reducers/createAction';
import {getAftermathGoalText} from '../reducers/missions/aftermath';
import {getANewThreatGoalText} from '../reducers/missions/aNewThreat';
import {getASimpleTaskGoalText} from '../reducers/missions/aSimpleTask';
import {getBrushfireGoalText} from '../reducers/missions/brushfire';
import {getCapturedGoalText} from '../reducers/missions/captured';
import {getChainOfCommandGoalText} from '../reducers/missions/chainOfCommand';
import {getDrawnInGoalText} from '../reducers/missions/drawnIn';
import {getFlySoloGoalText} from '../reducers/missions/flySolo';
import {getFriendsOfOldGoalText} from '../reducers/missions/friendsOfOld';
import {getGenerousDonationsGoalText} from '../reducers/missions/generousDonations';
import {getHighMoonGoalText} from '../reducers/missions/highMoon';
import {getHomecomingGoalText} from '../reducers/missions/homecoming';
import {getImperialHospitalityGoalText} from '../reducers/missions/imperialHospitality';
import {getImpoundedGoalText} from '../reducers/missions/impounded';
import {getIncomingGoalText} from '../reducers/missions/incoming';
import {getIndebtedGoalText} from '../reducers/missions/indebted';
import {getLastStandGoalText} from '../reducers/missions/lastStand';
import {getLooseCannonGoalText} from '../reducers/missions/looseCannon';
import {getLuxuryCruiseGoalText} from '../reducers/missions/luxuryCruise';
import {getMeansOfProductionGoalText} from '../reducers/missions/meansOfProduction';
import {getSorryAboutTheMessGoalText} from '../reducers/missions/sorryAboutTheMess';
import {getTargetOfOpportunityGoalText} from '../reducers/missions/targetOfOpportunity';
import {getTemptationGoalText} from '../reducers/missions/temptation';
import {getTheSpiceJobGoalText} from '../reducers/missions/theSpiceJob';
import {getTheSourceGoalText} from '../reducers/missions/theSource';
import {getUnderSiegeGoalText} from '../reducers/missions/underSiege';
import {getVipersDenGoalText} from '../reducers/missions/vipersDen';
import {getWantedGoalText} from '../reducers/missions/wanted';
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
    case 'chainOfCommand':
      return getChainOfCommandGoalText(state);
    case 'drawnIn':
      return getDrawnInGoalText(state);
    case 'flySolo':
      return getFlySoloGoalText(state);
    case 'friendsOfOld':
      return getFriendsOfOldGoalText(state);
    case 'generousDonations':
      return getGenerousDonationsGoalText(state);
    case 'highMoon':
      return getHighMoonGoalText(state);
    case 'homecoming':
      return getHomecomingGoalText(state);
    case 'imperialHospitality':
      return getImperialHospitalityGoalText(state);
    case 'impounded':
      return getImpoundedGoalText(state);
    case 'incoming':
      return getIncomingGoalText(state);
    case 'indebted':
      return getIndebtedGoalText(state);
    case 'lastStand':
      return getLastStandGoalText(state);
    case 'looseCannon':
      return getLooseCannonGoalText(state);
    case 'luxuryCruise':
      return getLuxuryCruiseGoalText(state);
    case 'meansOfProduction':
      return getMeansOfProductionGoalText(state);
    case 'sorryAboutTheMess':
      return getSorryAboutTheMessGoalText(state);
    case 'targetOfOpportunity':
      return getTargetOfOpportunityGoalText(state);
    case 'temptation':
      return getTemptationGoalText(state);
    case 'theSpiceJob':
      return getTheSpiceJobGoalText(state);
    case 'theSource':
      return getTheSourceGoalText(state);
    case 'underSiege':
      return getUnderSiegeGoalText(state);
    case 'vipersDen':
      return getVipersDenGoalText(state);
    case 'wanted':
      return getWantedGoalText(state);
    default:
      return [];
  }
};

const mapStateToProps = (state: StateType) => ({
  currentMission: state.app.currentMission,
  generalWeissActive: state.chainOfCommand.generalWeissActive,
  generalWeissDeployed: state.chainOfCommand.generalWeissDeployed,
  generousDonationsVirusUploaded: state.generousDonations.virusUploaded,
  goalText: getGoalText(state),
  lastStandVaderDeployed: state.lastStand.doorState === 3,
});

const looseCannonDefeatAtst = () => createAction('LOOSE_CANNON_DEFEAT_ATST');
const spiceJobGetKeycard = () => createAction('SPICE_JOB_GET_KEYCARD');
const incomingEnterCorridor = () => createAction('INCOMING_ENTER_CORRIDOR');
const vipersDenHeroGetCore = () => createAction('VIPERS_DEN_HERO_GET_CORE');
const vipersDenImperialGetCore = () => createAction('VIPERS_DEN_IMPERIAL_GET_CORE');
const vipersDenFigureDropsCore = () => createAction('VIPERS_DEN_FIGURE_DROPS_CORE');
const vipersDenImperialEscapes = () => createAction('VIPERS_DEN_IMPERIAL_ESCAPES');
const generousDonationsTerminalDestroyed = (id: number) =>
  createAction('GENEROUS_DONATIONS_TERMINAL_DESTROYED', {id});
const chainOfCommandTerminalInteract = () => createAction('CHAIN_OF_COMMAND_TERMINAL_INTERACT');
const chainOfCommandWeissDefends = () => createAction('CHAIN_OF_COMMAND_WEISS_DEFENDS');
const chainOfCommandWeissEntered = () => createAction('CHAIN_OF_COMMAND_WEISS_ENTERED');
const theSourceOfficerFreed = () => createAction('THE_SOURCE_OFFICER_FREED');
const lastStandVaderBlock = () => createAction('LAST_STAND_VADER_BLOCK');

const mapDispatchToProps = {
  chainOfCommandTerminalInteract,
  chainOfCommandWeissDefends,
  chainOfCommandWeissEntered,
  generousDonationsTerminalDestroyed,
  incomingEnterCorridor,
  lastStandVaderBlock,
  looseCannonDefeatAtst,
  spiceJobGetKeycard,
  theSourceOfficerFreed,
  vipersDenFigureDropsCore,
  vipersDenHeroGetCore,
  vipersDenImperialEscapes,
  vipersDenImperialGetCore,
};

export default connect(mapStateToProps, mapDispatchToProps)(GoalPanel);
