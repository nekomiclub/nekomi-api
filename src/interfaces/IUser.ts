export interface IUser {
  id: string
  username: string
  avatar: string
  banner: string

  /** @private */
  statistics: IUserStatistics

  /** @private */
  libs: IUserLib[]

  /** @private */
  roles: string[]

  /** @private */
  watchProgress: IUserWatchProgress[]

  /** @private */
  telegramData: IUserTelegramData | null

  /** 
   * Access token to verify user telegram link request
   * @private 
   */
  telegramLinkToken: string | null

  /** Events subscribes */
  subscribes: string[]
}

/** User nekomi statistics */
export interface IUserStatistics {
  isTelegramLinked: boolean

  dubber_team_member: string | null

  /** UTC-0 timestamp */
  accountCreated: number

  /** Viewtime in seconds */
  viewtime: number
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

export type UserLibType = 'favorite' | 'watching' | 'watched' | 'delayed' | 'plans' | 'custom'

export interface IUserLib {
  id: string
  type: UserLibType

  /** UTC-0 timestamp */
  createdAt: number

  /** Titles IDs */
  titles: string[]

  settings: {
    name: string

    /** Visibility to others */
    hidden: boolean

    /** Protection from settings changes */
    immortal: boolean
  }
}



export default IUser;