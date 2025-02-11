export interface IUser {
  id: string
  username: string
  avatar: string
  banner: string
  togetherRooms: IUserTogetherRoom[]

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

  /** @private */
  telegramLinkToken: string | null

  /** Events subscribes
   * @see docs/features.md#user-subscribes
   */
  subscribes: string[]
}

/** User nekomi statistics */
export interface IUserStatistics {
  isTelegramLinked: boolean

  /** Dubber team ID in which user is member
   * @deprecated use dubberTeamMember
   */
  dubber_team_member: string | null

  /** Dubber team ID in which user is member */
  dubberTeamMember: string | null

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

export type TUserLibType = 'favorite' | 'watching' | 'watched' | 'delayed' | 'plans' | 'custom'

export interface IUserLib {
  id: string
  type: TUserLibType

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



export default IUser;