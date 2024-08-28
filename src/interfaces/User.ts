export interface IUser {
  /** ID */
  id: string

  /** Statistics  */
  statistics: IUserStatistics

  /** Titles libs */
  libs: IUserLib[]

  /** Roles */
  roles: string[]

  /** Username */
  username: string

  /** Avatar URL */
  avatar: string

  /** Events subscribes
   * @see docs/features.md#user-subscribes
   * @access only API
   */
  subscribes: string[]

  watchProgress: IUserWatchProgress[]

  /** Telegram linked account data.
   * @access only API
   */
  telegramData: null | {
    id: number
  }
}

/** User animee statistics */
export interface IUserStatistics {
  /** UTC0 account creation timestamp */
  accountCreated: number

  /** Watch time in minutes
   * @deprecated refactored into viewtime.
   */
  timeSpent: number

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