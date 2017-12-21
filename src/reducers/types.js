// @flow

import type {AftermathStateType} from './missions/aftermath';
import type {AppStateType} from './app';
import type {BrushfireStateType} from './missions/brushfire';
import type {CapturedStateType} from './missions/captured';
import type {DrawnInStateType} from './missions/drawnIn';
import type {EventsStateType} from './events';
import type {FlySoloStateType} from './missions/flySolo';
import type {FriendsOfOldStateType} from './missions/friendsOfOld';
import type {HighMoonStateType} from './missions/highMoon';
import type {HomecomingStateType} from './missions/homecoming';
import type {ImperialHospitalityStateType} from './missions/imperialHospitality';
import type {ImperialsStateType} from './imperials';
import type {ImpoundedStateType} from './missions/impounded';
import type {IndebtedStateType} from './missions/indebted';
import type {LooseCannonStateType} from './missions/looseCannon';
import type {MeansOfProductionStateType} from './missions/meansOfProduction';
import type {MissionStateType} from './mission';
import type {ModalStateType} from './modal';
import type {RebelsStateType} from './rebels';
import type {TargetOfOpportunityStateType} from './missions/targetOfOpportunity';
import type {TemptationStateType} from './missions/temptation';
import type {TheSpiceJobStateType} from './missions/theSpiceJob';
import type {UnderSiegeStateType} from './missions/underSiege';
import type {WantedStateType} from './missions/wanted';

export type StateType = {
  aftermath: AftermathStateType,
  app: AppStateType,
  brushfire: BrushfireStateType,
  captured: CapturedStateType,
  drawnIn: DrawnInStateType,
  events: EventsStateType,
  flySolo: FlySoloStateType,
  friendsOfOld: FriendsOfOldStateType,
  highMoon: HighMoonStateType,
  homecoming: HomecomingStateType,
  imperialHospitality: ImperialHospitalityStateType,
  imperials: ImperialsStateType,
  impounded: ImpoundedStateType,
  indebted: IndebtedStateType,
  looseCannon: LooseCannonStateType,
  meansOfProduction: MeansOfProductionStateType,
  mission: MissionStateType,
  modal: ModalStateType,
  rebels: RebelsStateType,
  targetOfOpportunity: TargetOfOpportunityStateType,
  temptation: TemptationStateType,
  theSpiceJob: TheSpiceJobStateType,
  underSiege: UnderSiegeStateType,
  wanted: WantedStateType,
};
