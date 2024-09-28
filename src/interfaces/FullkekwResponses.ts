import { config } from '../config';

export const FK_USAPI_ROUTES = {
  get_user: (id: string) => `${config.URL.fullkekw_usapi}/user/${id}`,
  refresh: `${config.URL.fullkekw_usapi}/auth/refresh`,
};

/** GET fk-usapi/user/:id */
export interface IFK_UsapiGetUser {
  msg: string
  user: {
    /** FK-Usapi ID */
    id: string

    /** Username */
    username: string

    /** Email */
    email: string

    /** Avatar */
    avatarURL: string
  }
}

/** GET fk-usapi/auth/refresh */
export interface IFK_UsapiAuthRefresh {
  msg: string

  /** FK-Usapi ID */
  id: string

  /** Username */
  username: string

  /** Avatar */
  avatar: string
}



export const FK_AUTHORITY_ROUTES = {
  verify: `${config.URL.fullkekw_authority}/verify`,
};

/** POST fk-authority/verify */
export interface IFK_AuthorityVerify {
  msg: string,

  /** Token verification */
  verified: boolean

  /** Token origin */
  origin: string
}