export interface IUser {
  /** User ID */
  id: string

  /** User ID
   * @deprecated 1.1.0
   */
  uid: string

  /** User username
   * @deprecated in 1.1.0 fullkekw usapi will manage this
   */
  username: string

  /** User password
   * * userDTO will hide this field
   * @deprecated in 1.1.0 fullkekw usapi will manage this
   */
  password: string

  /** User email
   * * userDTO will hide this field
   * May be deprecated in future
   */
  email: string

  /** User avatar URL
   * @deprecated in 1.1.0 fullkekw usapi will manage this
   */
  avatar: string

  /** Profile background
   * @deprecated due to possible future updates
   */
  profileBg: string | null

  /** User badges
   * @deprecated due to possible future updates
   */
  badgesIDs: string[] | null

  /** User settings
   * * userDTO will hide this field (in future only owner can get this object)
   * May be deprecated in future
   */
  settings: IUserSettings

  /** User stats
   * @deprecated due to possible future updates
   */
  stats: IUserStats

  /** User lists
   * May be deprecated in future
   */
  lists: IUserList[]

  /** User auth providers
   * * userDTO will hide this field
   * @deprecated in 1.1.0 fullkekw usapi will manage this
   */
  providers: TAuthProviders[]

  /** User roles */
  roles: string[]

  /** User account type
   * * userDTO will hide this field
   * @deprecated impact on nothing, was actual for migration
   */
  accountType: 'old' | 'new'
}

/** User settings interface */
export interface IUserSettings {
  void?: void
}

/** User stats interface
 * @deprecated due to possible future updates
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
 * @deprecated due to possible future updates
 */
interface IUserStatsWatchedTitles {
  title: string,
  dubs: IUserStatsWatchedTitlesDub[]
}

/** User watched title dubs interface
 * @deprecated due to possible future updates
 */
interface IUserStatsWatchedTitlesDub {
  id: string,
  totalWatch: number
}

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