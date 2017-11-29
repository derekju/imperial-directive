// @flow

import type {AftermathStateType} from './missions/aftermath';
import type {AppStateType} from './app';
import type {EventsStateType} from './events';
import type {ImperialsStateType} from './imperials';
import type {MissionStateType} from './mission';
import type {ModalStateType} from './modal';
import type {RebelsStateType} from './rebels';

export type StateType = {
  aftermath: AftermathStateType,
  app: AppStateType,
  events: EventsStateType,
  imperials: ImperialsStateType,
  mission: MissionStateType,
  modal: ModalStateType,
  rebels: RebelsStateType,
};
