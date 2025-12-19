import { ISODateString } from './types';



export interface IUser {
  id: string
  username: string
  avatar: string
  cover: string

  roles: string[] // Protected
  libs: IUserLib[] // Protected

  /** Total user viewtime in seconds */
  total_viewtime: number // Protected
  view_progress: IUserViewProgress[] // Protected
  dubber_team_member: string | null // Protected
  telegram_id: number | null // Protected

  created_at: ISODateString // Protected
  updated_at: ISODateString // Protected
}

export interface IUserViewProgress {
  anime_id: string
  dubber_id: string
  episode: number
  updated_at: ISODateString

  /** Watch progress in seconds */
  progress: number
}

export type UserLibType = 'favorite' | 'watching' | 'watched' | 'delayed' | 'plans'

export interface IUserLib {
  id: string
  type: UserLibType
  anime_ids: string[]

  is_public: boolean
  created_at: ISODateString
}



export default IUser;