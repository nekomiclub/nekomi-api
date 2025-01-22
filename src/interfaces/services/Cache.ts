import { ITitle } from '../Title';
import { IUser } from '../User';

interface ITitleWithMediaMeta extends ITitle {
  videoURL: string
  backgroundURL: string
}

export interface ICacheHomeWrapped {
  /** MUST BE PRESENT WHEN PUSHING IN CACHE */
  DEFINE_KEY?: string

  /** Home featured titles */
  featured: ITitleWithMediaMeta[]

  popular: ITitle[]
  updatedRecently: ITitle[]
  hightRated: ITitle[]
}

export interface ICacheDubbedAnime {
  /** Cache only. Must equal dubber:dubbed_anime */
  DEFINE_KEY?: string

  dubberId: string
  titles: ITitle[]
}

export interface ICacheParsedMembers {
  /** Cache only. Must equal dubber:parsed_members */
  DEFINE_KEY?: string

  dubberId: string
  members: IUser[]
}