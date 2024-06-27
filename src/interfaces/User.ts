export interface IUser {
  /** ID */
  id: string

  /** Statistics
   * Inherit stats
   */
  statistics: IUserStatistics

  /** Titles libs
   * Inherit lists
   */
  libs: IUserLib[]

  /** Roles */
  roles: string[]

  /** Username */
  username: string

  /** Avatar URL */
  avatar: string
}

/** User animee statistics
 * Inherit IUserStats
 */
export interface IUserStatistics {
  /** UTC0 account creation timestamp */
  accountCreated: number

  /** Watch time in minutes
   * @todo May be renamed into viewtime
   */
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