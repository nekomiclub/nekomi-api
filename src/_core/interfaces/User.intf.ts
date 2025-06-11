export interface User {
  id: string
  username: string
  avatar: string
  banner: string

  /** @private */
  statistics: UserStatistics

  /** @private */
  libs: UserLib[]

  /** @private */
  roles: string[]

  /** @private */
  watchProgress: UserWatchProgress[]

  /** @private */
  telegramData: UserTelegramData | null

  /** 
   * Access token to verify user telegram link request
   * @private 
   */
  telegramLinkToken: string | null

  /** Events subscribes */
  subscribes: string[]
}

/** User nekomi statistics */
export interface UserStatistics {
  isTelegramLinked: boolean

  dubber_team_member: string | null

  /** UTC-0 timestamp */
  accountCreated: number

  /** Viewtime in seconds */
  viewtime: number
}

/** User watch progress item */
export interface UserWatchProgress {
  titleID: string
  dubberID: string
  episodeOrder: number

  /** Watch progress in seconds */
  progress: number

  /** Last update UTC-0 timestamp */
  updatedAt: number
}

export interface UserTelegramData {
  id: number
}

export type UserLibType = 'favorite' | 'watching' | 'watched' | 'delayed' | 'plans' | 'custom'

export interface UserLib {
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



export default User;