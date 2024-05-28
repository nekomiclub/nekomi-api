export interface IUser {
  /** ID */
  id: string

  /** Username
   * @deprecated Managed by fk-usapi
   */
  username: string

  /** Avatar
   * @deprecated Managed by fk-usapi
   */
  avatar: string

  /** User stats
   * @deprecated will be refactored into statistics
   * @since 1.1.1
   */
  stats: IUserStats

  /** Statistics
   * Inherit stats
   */
  statistics: IUserStatistics

  /** User lists
   * @deprecated will be refactored into libs
   * @since 1.1.1
   */
  lists: IUserList[]

  /** Titles libs
   * Inherit lists
   */
  libs: IUserLib[]

  /** Roles */
  roles: string[]
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