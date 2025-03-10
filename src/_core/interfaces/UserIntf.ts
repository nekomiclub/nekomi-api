export interface User {
  id: string
  username: string
  avatar: string
  banner: string
  togetherRooms: UserTogetherRoom[]

  /** @private */
  statistics: UserStatistics

  /** @private */
  libs: UserLib[]

  /** @private */
  roles: string[]

  /** @private */
  watchProgress: UserWatchProgress[]

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
export interface UserStatistics {
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
export interface UserWatchProgress {
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

export interface UserLib {
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

export interface UserTogetherRoom {
  id: string
  titleId: string
  settings: {
    name: string
    password: string | null

    usersCanControl: boolean
    accurateSync: boolean
  }
}



/** @deprecated use UserStatistics instead */
export type IUserStatistics = UserStatistics;

/** @deprecated use UserTogetherRoom instead */
export type IUserTogetherRoom = UserTogetherRoom

/** @deprecated use UserWatchProgress instead */
export type IUserWatchProgress = UserWatchProgress;

/** @deprecated use UserLib instead */
export type IUserLib = UserLib;

export type IUser = User;
export default User;