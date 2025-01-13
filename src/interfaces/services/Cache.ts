import { ITitle } from '../Title';

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
  dubberId: string
  titles: ITitle[]
}