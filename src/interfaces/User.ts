export interface IUser {
  /** ID */
  id: string

  /** Statistics
   * @access CSRF required
   */
  statistics: IUserStatistics

  /** Titles libs
   * @access CSRF required
   */
  libs: IUserLib[]

  /** Roles
   * @access CSRF required
   */
  roles: string[]

  /** Username */
  username: string

  /** Avatar URL */
  avatar: string

  /** User banner URL */
  banner: string

  /** Events subscribes
   * @see docs/features.md#user-subscribes
   * @access only API
   */
  subscribes: string[]

  /** Synced watch progress
   * @access CSRF required
   */
  watchProgress: IUserWatchProgress[]

  /** Telegram linked account data.
   * @access only API
   */
  telegramData: null | IUserTelegramData

  /** Token for linking telegram to nekomi account
   * @access CSRF required
   */
  telegramLinkToken: string | null
}

/** User nekomi statistics */
export interface IUserStatistics {
  /** UTC0 account creation timestamp */
  accountCreated: number

  /** Viewtime in seconds */
  viewtime: number

  isTelegramLinked: boolean
}

/** User watch progress item */
export interface IUserWatchProgress {
  titleID: string
  dubberID: string
  episodeOrder: number

  /** Watch progress in seconds */
  progress: number

  /** Last update UTC-0 timestamp */
  updatedAt: number
}

export interface IUserTelegramData {
  id: number
}

/** User lib type */
type TUserLibType = 'favorite' | 'watching' | 'watched' | 'delayed' | 'plans' | 'custom'

/** User titles lib */
export interface IUserLib {
  /** ID */
  id: string

  /** UTC0 creation timestamp */
  createdAt: number

  /** Titles IDs */
  titles: string[]

  /** Type */
  type: TUserLibType

  /** Settings */
  settings: {
    /** Name */
    name: string

    /** Visibility to others */
    hidden: boolean

    /** Protection from settings changes */
    immortal: boolean
  }
}