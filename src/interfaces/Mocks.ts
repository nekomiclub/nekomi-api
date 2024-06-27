import { TRoleCapability } from './Roles';

export type TMockID = 'AccessControl' | 'CSRFCheck' | 'UserSignin'

/** Mock interface */
export interface IMock<T = any> {
  /** Mock ID. */
  id: TMockID

  /** Mock response code. > 400 will throw an error */
  code: number

  /** Mock payload */
  data: T
}



/** AccessControl mock */
export interface IM_AccessControl {
  /** User ID */
  id: string

  /** Required capabilities */
  capabilities?: TRoleCapability[]
}

/** CSRFCheck mock */
export interface IM_CSRFCheck {
  /** CSRF validity */
  verified: boolean

  /** CSRF origin */
  origin: string
}