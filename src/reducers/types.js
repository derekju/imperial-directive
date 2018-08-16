// @flow

import type {AftermathStateType} from './missions/aftermath';
import type {AppStateType} from './app';
import type {ArmedAndOperationalStateType} from './missions/armedAndOperational';
import type {BinaryRevolutionStateType} from './missions/binaryRevolution';
import type {BraceForImpactStateType} from './missions/braceForImpact';
import type {BreakingPointStateType} from './missions/breakingPoint';
import type {BrushfireStateType} from './missions/brushfire';
import type {CanyonRunStateType} from './missions/canyonRun';
import type {CapturedStateType} from './missions/captured';
import type {CelebrationStateType} from './missions/celebration';
import type {ChainOfCommandStateType} from './missions/chainOfCommand';
import type {DarkObsessionStateType} from './missions/darkObsession';
import type {DesperateHourStateType} from './missions/desperateHour';
import type {DrawnInStateType} from './missions/drawnIn';
import type {EscapeFromCloudCityStateType} from './missions/escapeFromCloudCity';
import type {EventsStateType} from './events';
import type {FireInTheSkyStateType} from './missions/fireInTheSky';
import type {FlySoloStateType} from './missions/flySolo';
import type {ForestAmbushStateType} from './missions/forestAmbush';
import type {FriendsOfOldStateType} from './missions/friendsOfOld';
import type {GenerousDonationsStateType} from './missions/generousDonations';
import type {HighMoonStateType} from './missions/highMoon';
import type {HomecomingStateType} from './missions/homecoming';
import type {HuntedDownStateType} from './missions/huntedDown';
import type {ImperialEntanglementsStateType} from './missions/imperialEntanglements';
import type {ImperialHospitalityStateType} from './missions/imperialHospitality';
import type {ImperialsStateType} from './imperials';
import type {ImpoundedStateType} from './missions/impounded';
import type {IncomingStateType} from './missions/incoming';
import type {IndebtedStateType} from './missions/indebted';
import type {InfectionStateType} from './missions/infection';
import type {InfiltratedStateType} from './missions/infiltrated';
import type {LastStandStateType} from './missions/lastStand';
import type {LooseCannonStateType} from './missions/looseCannon';
import type {MeansOfProductionStateType} from './missions/meansOfProduction';
import type {MissionStateType} from './mission';
import type {ModalStateType} from './modal';
import type {PastLifeEnemiesStateType} from './missions/pastLifeEnemies';
import type {RebelsStateType} from './rebels';
import type {ShadyDealingsStateType} from './missions/shadyDealings';
import type {SurvivalOfTheFittestStateType} from './missions/survivalOfTheFittest';
import type {SympathyForTheRebellionStateType} from './missions/sympathyForTheRebellion';
import type {TargetOfOpportunityStateType} from './missions/targetOfOpportunity';
import type {TemptationStateType} from './missions/temptation';
import type {TheBattleOfHothStateType} from './missions/theBattleOfHoth';
import type {TheHardWayStateType} from './missions/theHardWay';
import type {TheSourceStateType} from './missions/theSource';
import type {TheSpiceJobStateType} from './missions/theSpiceJob';
import type {UnderSiegeStateType} from './missions/underSiege';
import type {VipersDenStateType} from './missions/vipersDen';
import type {WantedStateType} from './missions/wanted';

export type StateType = {
  aftermath: AftermathStateType,
  app: AppStateType,
  armedAndOperational: ArmedAndOperationalStateType,
  binaryRevolution: BinaryRevolutionStateType,
  braceForImpact: BraceForImpactStateType,
  breakingPoint: BreakingPointStateType,
  brushfire: BrushfireStateType,
  canyonRun: CanyonRunStateType,
  captured: CapturedStateType,
  celebration: CelebrationStateType,
  chainOfCommand: ChainOfCommandStateType,
  darkObsession: DarkObsessionStateType,
  desperateHour: DesperateHourStateType,
  drawnIn: DrawnInStateType,
  escapeFromCloudCity: EscapeFromCloudCityStateType,
  events: EventsStateType,
  fireInTheSky: FireInTheSkyStateType,
  flySolo: FlySoloStateType,
  forestAmbush: ForestAmbushStateType,
  friendsOfOld: FriendsOfOldStateType,
  generousDonations: GenerousDonationsStateType,
  highMoon: HighMoonStateType,
  homecoming: HomecomingStateType,
  huntedDown: HuntedDownStateType,
  imperialEntanglements: ImperialEntanglementsStateType,
  imperialHospitality: ImperialHospitalityStateType,
  imperials: ImperialsStateType,
  impounded: ImpoundedStateType,
  incoming: IncomingStateType,
  indebted: IndebtedStateType,
  infection: InfectionStateType,
  infiltrated: InfiltratedStateType,
  lastStand: LastStandStateType,
  looseCannon: LooseCannonStateType,
  meansOfProduction: MeansOfProductionStateType,
  mission: MissionStateType,
  modal: ModalStateType,
  pastLifeEnemies: PastLifeEnemiesStateType,
  rebels: RebelsStateType,
  router: {
    location: {
      hash: string,
      pathname: string,
      search: string,
    },
  },
  shadyDealings: ShadyDealingsStateType,
  survivalOfTheFittest: SurvivalOfTheFittestStateType,
  sympathyForTheRebellion: SympathyForTheRebellionStateType,
  targetOfOpportunity: TargetOfOpportunityStateType,
  temptation: TemptationStateType,
  theBattleOfHoth: TheBattleOfHothStateType,
  theHardWay: TheHardWayStateType,
  theSpiceJob: TheSpiceJobStateType,
  theSource: TheSourceStateType,
  underSiege: UnderSiegeStateType,
  vipersDen: VipersDenStateType,
  wanted: WantedStateType,
};
