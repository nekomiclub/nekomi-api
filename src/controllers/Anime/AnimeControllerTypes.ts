import Anime, { AnimeGenre, AnimeMedia, AnimeRate, AnimeRelated, AnimeSeason } from '~/core/interfaces/AnimeIntf';
import { DubberCompact } from '~/core/interfaces/DubberIntf';
import { Metadata } from '~/core/interfaces/types';



export interface AnimeGetAll {
  total: number

  /** With malId and country */
  fullfilled: number

  /** With country only */
  updated: number
}

export interface AnimeGetByQueryProps {
  query: string

  /** Return only metadata. Will set anime object to null */
  metadataOnly?: boolean

  /** Return detailed document */
  detailed?: boolean

  fetchDubbers?: boolean
  fetchRelated?: boolean
}

export interface AnimeGetByQuery {
  /** Will be undefined with metadataOnly specified */
  anime?: Anime

  genres?: AnimeGenre[]
  media?: AnimeMedia
  rate?: AnimeRate
  season?: AnimeSeason

  related?: AnimeRelated[]
  dubbers?: DubberCompact[]
  metadata?: Metadata
}

export interface AnimeGetSearchProps {
  /**
   * Query ~all will return all anime documents in order
   * Query ~wo-mal-id will return anime documents without malId specified (malId = null)
  */
  q: string
}

export type AnimeGetSearch = Anime[]

export interface AnimeWithMedia extends Anime {
  videoURL: string
  backgroundURL: string
}

export interface AnimeFeatured {
  headliners: AnimeWithMedia[]
  hot: Anime[]
  rated: Anime[]
  updatedRecently: Anime[]
}

export interface AnimePostProps {
  nameEng: string
}

export interface AnimeDeleteByUuidProps {
  uuid: string
}