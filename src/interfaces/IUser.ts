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

  avatar: CDNString
  cover: CDNString

  roles: string[]
  total_viewtime: number // In seconds
  dubber_team_member: string | null
  username_changed_at: ISODateString

  email: string // Protected
  libs: IUserLib[] // Protected
  restrictions: USER_RESTRICTION[] // Protected
  view_progress: IUserViewProgress[] // Protected

  sessions: IUserSession[] // Private
  subscriptions: string[] // Private
  telegram_id: number | null // Private

  created_at: ISODateString // Private
  updated_at: ISODateString // Private
}

export interface IUserViewProgress {
  anime_id: string
  dubber_id: string
  episode: number
  updated_at: ISODateString
  progress: number // In seconds
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