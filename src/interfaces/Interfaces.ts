import { TRoleCapability } from './Roles';

/** Deep copy interface and return it with optional keys */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/** Copy interface and return it with optional keys */
export type Partial<T> = {
  [P in keyof T]?: T[P];
};