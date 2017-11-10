// @flow

import type {AppStateType} from './app';
import type {ImperialsStateType} from './imperials';
import type {MissionStateType} from './mission';
import type {ModalStateType} from './modal';
import type {RebelsStateType} from './rebels';

export type StateType = {
  app: AppStateType,
  imperials: ImperialsStateType,
  mission: MissionStateType,
  modal: ModalStateType,
  rebels: RebelsStateType,
};
