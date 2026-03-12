import { AnimeId } from './IAnime';
import { BrandedId, CDNString, ISODateString } from './types';
import { TeamId } from './IDubber';
import { asBrandedId } from './types';



export type UserId = BrandedId<string, 'userId'>;
export type UserLibId = BrandedId<string, 'userLibId'>;
export type UserSessionId = BrandedId<string, 'userSessionId'>;



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
  id: UserId
  username: string

  avatar: CDNString
  cover: CDNString

  /** Roles slugs */
  roles: string[]
  total_viewtime: number // In seconds
  dubber_team_member: string | null
  username_changed_at: ISODateString

  email: string // Protected
  libs: IUserLib[] // Protected
  restrictions: USER_RESTRICTION[] // Protected
  view_progress: IUserViewProgress[] // Protected
  created_at: ISODateString // Protected
  updated_at: ISODateString // Protected

  sessions: IUserSession[] // Private
  subscriptions: string[] // Private
  telegram_id: number | null // Private
}

export interface IUserViewProgress {
  anime_id: AnimeId
  dubber_id: TeamId
  episode: number
  updated_at: ISODateString
  progress: number // In seconds
}

export interface IUserLib {
  id: UserLibId
  type: USER_LIB_TYPE
  anime_ids: AnimeId[]

  is_public: boolean
  created_at: ISODateString
}

export interface IUserSession {
  id: UserSessionId

  is_limited: boolean

  expires_at: ISODateString
  created_at: ISODateString
}

export type UserCardType = Pick<IUser, 'id' | 'username' | 'avatar' | 'cover'>



export const asUserId = (asBrandedId<UserId>);
export const asUserLibId = (asBrandedId<UserLibId>);
export const asUserSessionId = (asBrandedId<UserSessionId>);

export default IUser;