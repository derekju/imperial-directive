// @flow

import type {AftermathStateType} from './missions/aftermath';
import type {AppStateType} from './app';
import type {BrushfireStateType} from './missions/brushfire';
import type {CapturedStateType} from './missions/captured';
import type {EventsStateType} from './events';
import type {ImperialHospitalityStateType} from './missions/imperialHospitality';
import type {ImperialsStateType} from './imperials';
import type {ImpoundedStateType} from './missions/impounded';
import type {MeansOfProductionStateType} from './missions/meansOfProduction';
import type {MissionStateType} from './mission';
import type {ModalStateType} from './modal';
import type {RebelsStateType} from './rebels';
import type {TemptationStateType} from './missions/temptation';
import type {UnderSiegeStateType} from './missions/underSiege';

export type StateType = {
  aftermath: AftermathStateType,
  app: AppStateType,
  brushfire: BrushfireStateType,
  captured: CapturedStateType,
  events: EventsStateType,
  imperialHospitality: ImperialHospitalityStateType,
  imperials: ImperialsStateType,
  impounded: ImpoundedStateType,
  meansOfProduction: MeansOfProductionStateType,
  mission: MissionStateType,
  modal: ModalStateType,
  rebels: RebelsStateType,
  temptation: TemptationStateType,
  underSiege: UnderSiegeStateType,
};
