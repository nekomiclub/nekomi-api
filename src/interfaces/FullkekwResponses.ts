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



/** POST fk-authority/verify */
export interface IFK_AuthorityVerify {
  msg: string,

  /** Token verification */
  verified: boolean

  /** Token origin */
  origin: string
}