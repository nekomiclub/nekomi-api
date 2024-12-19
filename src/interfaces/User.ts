/** Public user object that dto return */
export interface IUser_Public {
  id: string
  username: string
  avatar: string
  banner: string
}

export interface IUser extends IUser_Public {
  statistics: IUserStatistics
  libs: IUserLib[]
  roles: string[]
  watchProgress: IUserWatchProgress[]
  telegramData: IUserTelegramData | null
  togetherRooms: IUserTogetherRoom[]

  telegramLinkToken: string | null

  /** Events subscribes
   * @see docs/features.md#user-subscribes
   */
  subscribes: string[]
}

/** User nekomi statistics */
export interface IUserStatistics {
  isTelegramLinked: boolean

  /** Dubber team ID in which user is member */
  dubber_team_member: string | null

  /** UTC0 account creation timestamp */
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

  /** Last update UT-0 timestamp */
  updatedAt: number
}

export interface IUserTelegramData {
  id: number
}

export type TUserLibType = 'favorite' | 'watching' | 'watched' | 'delayed' | 'plans' | 'custom'

export interface IUserLib {
  id: string
  type: TUserLibType

  /** UTC0 creation timestamp */
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

export interface IUserTogetherRoom {
  id: string
  titleId: string
  settings: {
    name: string
    password: string | null

    usersCanControl: boolean
    accurateSync: boolean
  }
}