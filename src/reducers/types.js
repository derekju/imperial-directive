// @flow

import type {AftermathStateType} from './missions/aftermath';
import type {AppStateType} from './app';
import type {CapturedStateType} from './missions/captured';
import type {EventsStateType} from './events';
import type {ImperialsStateType} from './imperials';
import type {MissionStateType} from './mission';
import type {ModalStateType} from './modal';
import type {RebelsStateType} from './rebels';
import type {UnderSiegeStateType} from './missions/underSiege';

export type StateType = {
  aftermath: AftermathStateType,
  app: AppStateType,
  captured: CapturedStateType,
  events: EventsStateType,
  imperials: ImperialsStateType,
  mission: MissionStateType,
  modal: ModalStateType,
  rebels: RebelsStateType,
  underSiege: UnderSiegeStateType,
};
