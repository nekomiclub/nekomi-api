import { ITitle } from '../Title';

interface ITitleWithMediaMeta extends ITitle {
  videoURL: string
  backgroundURL: string
}

export interface ICacheHomeWrapped {
  /** Home featured titles */
  featured: ITitleWithMediaMeta[]

  popular: ITitle[]
  updatedRecently: ITitle[]
  hightRated: ITitle[]
}