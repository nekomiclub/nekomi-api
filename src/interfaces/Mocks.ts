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
  id: string
  capabilities: TRoleCapability[]
  username: string
  avatar: string
}

/** CSRFCheck mock */
export interface IM_CSRFCheck {
  verified: boolean

  /** CSRF origin */
  origin: string
}