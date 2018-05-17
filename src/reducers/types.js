// @flow

import type {AftermathStateType} from './missions/aftermath';
import type {AppStateType} from './app';
import type {BrushfireStateType} from './missions/brushfire';
import type {CapturedStateType} from './missions/captured';
import type {ChainOfCommandStateType} from './missions/chainOfCommand';
import type {DesperateHourStateType} from './missions/desperateHour';
import type {DrawnInStateType} from './missions/drawnIn';
import type {EventsStateType} from './events';
import type {FlySoloStateType} from './missions/flySolo';
import type {FriendsOfOldStateType} from './missions/friendsOfOld';
import type {GenerousDonationsStateType} from './missions/generousDonations';
import type {HighMoonStateType} from './missions/highMoon';
import type {HomecomingStateType} from './missions/homecoming';
import type {ImperialHospitalityStateType} from './missions/imperialHospitality';
import type {ImperialsStateType} from './imperials';
import type {ImpoundedStateType} from './missions/impounded';
import type {IncomingStateType} from './missions/incoming';
import type {IndebtedStateType} from './missions/indebted';
import type {LooseCannonStateType} from './missions/looseCannon';
import type {LastStandStateType} from './missions/lastStand';
import type {MeansOfProductionStateType} from './missions/meansOfProduction';
import type {MissionStateType} from './mission';
import type {ModalStateType} from './modal';
import type {RebelsStateType} from './rebels';
import type {TargetOfOpportunityStateType} from './missions/targetOfOpportunity';
import type {TemptationStateType} from './missions/temptation';
import type {TheSpiceJobStateType} from './missions/theSpiceJob';
import type {TheSourceStateType} from './missions/theSource';
import type {UnderSiegeStateType} from './missions/underSiege';
import type {VipersDenStateType} from './missions/vipersDen';
import type {WantedStateType} from './missions/wanted';

export type StateType = {
  aftermath: AftermathStateType,
  app: AppStateType,
  brushfire: BrushfireStateType,
  captured: CapturedStateType,
  chainOfCommand: ChainOfCommandStateType,
  desperateHour: DesperateHourStateType,
  drawnIn: DrawnInStateType,
  events: EventsStateType,
  flySolo: FlySoloStateType,
  friendsOfOld: FriendsOfOldStateType,
  generousDonations: GenerousDonationsStateType,
  highMoon: HighMoonStateType,
  homecoming: HomecomingStateType,
  imperialHospitality: ImperialHospitalityStateType,
  imperials: ImperialsStateType,
  impounded: ImpoundedStateType,
  incoming: IncomingStateType,
  indebted: IndebtedStateType,
  lastStand: LastStandStateType,
  looseCannon: LooseCannonStateType,
  meansOfProduction: MeansOfProductionStateType,
  mission: MissionStateType,
  modal: ModalStateType,
  rebels: RebelsStateType,
  targetOfOpportunity: TargetOfOpportunityStateType,
  temptation: TemptationStateType,
  theSpiceJob: TheSpiceJobStateType,
  theSource: TheSourceStateType,
  underSiege: UnderSiegeStateType,
  vipersDen: VipersDenStateType,
  wanted: WantedStateType,
};
