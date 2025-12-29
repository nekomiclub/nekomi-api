import { CDNString, ISODateString } from './types';



export enum USER_RESTRICTION {
  BANNED = 'user:banned',
  UPLOAD_AVATAR = 'user:upload_avatar',
  UPLOAD_COVER = 'user:upload_cover',
  USERNAME_CHANGE = 'user:username_change',
}

export enum USER_LIB_TYPE {
  FAVORITE = 'favorite',
  WATCHING = 'watching',
  WATCHED = 'watched',
  DELAYED = 'delayed',
  PLANS = 'plans',
}



export interface IUser {
  id: string
  username: string
  email: string // Protected

  avatar: CDNString
  cover: CDNString

  roles: string[] // Protected
  libs: IUserLib[] // Protected
  restrictions: USER_RESTRICTION[] // Protected
  sessions: IUserSession[] // Protected
  subscriptions: string[] // Protected

  /** Total user viewtime in seconds */
  total_viewtime: number // Protected
  view_progress: IUserViewProgress[] // Protected
  dubber_team_member: string | null // Protected
  telegram_id: number | null // Protected

  created_at: ISODateString // Protected
  updated_at: ISODateString // Protected
  username_changed_at: ISODateString // Protected
}

export interface IUserViewProgress {
  anime_id: string
  dubber_id: string
  episode: number
  updated_at: ISODateString

  /** Watch progress in seconds */
  progress: number
}

export interface IUserLib {
  id: string
  type: USER_LIB_TYPE
  anime_ids: string[]

  is_public: boolean
  created_at: ISODateString
}

export interface IUserSession {
  id: string

  is_limited: boolean

  expires_at: ISODateString
  created_at: ISODateString
}

export default IUser;