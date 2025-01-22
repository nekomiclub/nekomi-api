import { TRoleCapability } from './Roles';

export type TMockID =
  /** Mocks fk-authority/verify endpoint */
  | 'FkAuthorityVerify'
  | 'FkUsapiAuthRefresh'

/** Mock interface */
export interface IMock<T = any> {
  /** Mock ID. */
  id: TMockID

  /** Mock response code. > 400 will throw an error */
  code: number

  /** Mock payload */
  data: T
}


/** FkUsapiAuthRefresh mock */
export interface IM_FkUsapiAuthRefresh {
  id: string
  capabilities: TRoleCapability[]
  username: string
  avatar: string
}

/** FkAuthorityVerify mock */
export interface IM_FkAuthorityVerify {
  verified: boolean

  /** CSRF origin */
  origin: string
}