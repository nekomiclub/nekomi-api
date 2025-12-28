export enum IUS_USER_AUTH_PROVIDER {
  GOOGLE = 'google',
}

export enum IUS_USER_AUTH_METHOD {
  GOOGLE_PROVIDER = 'provider:google'
}

export enum IUS_USER_RESTRICTION {
  BANNED = 'user:banned', // prev :banned
  UPLOAD_AVATAR = 'user:upload_avatar', // prev upload:avatar
  USERNAME_CHANGE = 'user:username_change', // prev change:username
}

export interface IUS_User {
  id: string
  username: string
  avatarURL: string
  email: string

  /**
   * @private
   */
  statistics: IUS_UserStatistics

  /**
   * User restrictions
   * 
   * @private
   */
  restrictions: IUS_USER_RESTRICTION[]

  /** 
   * Providers connected
   * 
   * @private
   */
  providersConnected: IUS_USER_AUTH_PROVIDER[]

  /** 
   * Active sessions
   * 
   * @private
   */
  sessions: IUS_UserSession[]
}

export interface IUS_UserStatistics {
  /** UTC timestamp */
  createdAt: number

  /** Username changed UTC timestamp */
  usernameChanged: number
}

export interface IUS_UserSession {
  id: string
  ip: string

  /** Created at UTC timestamp */
  timestamp: number

  /** Session active till timestamp, when it reached client must send refresh request
   * @private
   */
  activeTill: number

  /** Session unactive timestamp, when it reached session must be deleted
   * @private
    */
  expire: number

  /** Timestamp after this session must be deleted anyway
   * @private
   */
  maxAge: number

  /** Is session limitet flag
   * @since 1.2.1
   */
  isLimited: boolean
}

/** Session JWT token interface, must signed by session key @deprecated */
export interface IUS_SessionTokenOld {
  sessionId: string
  userId: string

  /** Created at UTC timestamp */
  timestamp: number
}

export default IUS_User;