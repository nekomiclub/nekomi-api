export interface IUser {
  /** ID */
  id: string

  /** Old ID
   * @deprecated 1.1.0
   */
  uid: string

  /** Username
   * Managed by fk-usapi
   */
  username: string

  /** Password
   * @deprecated Managed by fk-usapi
   */
  password: string

  /** Email
   * @deprecated Managed by fk-usapi
   */
  email: string

  /** Avatar
   * Managed by fk-usapi
   */
  avatar: string

  /** Profile background
   * @deprecated useless
   */
  profileBg: string | null

  /** Badges
   * @deprecated will appear in future
   */
  badgesIDs: string[] | null

  /** Settings
   * @deprecated will appear in future
   */
  settings: IUserSettings

  /** User stats
   * @deprecated will be refactored into statistics
   */
  stats: IUserStats

  /** Statistics
   * Inherit stats
   */
  statistics: null

  /** User lists
   * @deprecated will be refactored into libs
   */
  lists: IUserList[]

  /** Titles libs
   * Inherit lists
   */
  libs: []

  /** Auth providers
   * @deprecated Managed by fk-usapi
   */
  providers: TAuthProviders[]

  /** Roles */
  roles: string[]

  /** Account type
   * @deprecated impact on nothing, was actual for migration
   */
  accountType: 'old' | 'new'
}

/** User animee statistics
 * Inherit IUserStats
 */
export interface IUserStatistics {
  /** UTC0 account creation (on animee) timestamp */
  accountCreated: number

  /** Watch time in minutes */
  timeSpent: number
}

/** User lib type */
type TUserLibType = 'favorite' | 'watching' | 'watched' | 'delayed' | 'threwn' | 'custom'

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


/** User settings interface
 * @deprecated will appear in future
 */
export interface IUserSettings {
  void?: void
}

/** User stats interface
 * @deprecated refactored into IUserStatistics
 */
export interface IUserStats {
  createdAt: number,
  titles: {
    watched: number,
    favorites: number,
    plans: number,
    delayed: number,
    threwn: number
  },
  player: {
    totalWatched: number,
    popularDub: string | null,
    watchedTitles: IUserStatsWatchedTitles[] | null
  }
}

/** User watched titles stat interface
 * @deprecated refactored into IUserStatistics
 */
interface IUserStatsWatchedTitles {
  title: string,
  dubs: IUserStatsWatchedTitlesDub[]
}

/** User watched title dubs interface
 * @deprecated refactored into IUserStatistics
 */
interface IUserStatsWatchedTitlesDub {
  id: string,
  totalWatch: number
}

/** @deprecated refactored into IUserLibs */
export interface IUserList {
  titles: string[],
  createdAt: number,
  immortal: boolean,
  hidden: boolean,
  thumb: string,
  description: string,
  name: string,
  id: string
}

/** User auth providers type
 * @deprecated in 1.1.0 fullkekw usapi will manage this
 */
export type TAuthProviders = 'google' | 'telegram' | 'animee' | 'fullkekw'

/** User roles
 * @deprecated in 1.1.0 roles system will be refactored
 */
export type TUserRoles = 'root' | 'admin' | 'moderator' | 'dubber' | 'subber' | 'subscriber' | 'editor' | 'user'