import Anime, { HydratedAnime } from '~/core/interfaces/AnimeIntf';
import User from '~/core/interfaces/UserIntf';
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

  /** Return only metadata, without hydrated anime */
  metadataOnly?: boolean

  /** Return detailed document */
  detailed?: boolean

  /** @requires detailed mode */
  fetchDubbers?: boolean
  /** @requires detailed mode */
  fetchRelated?: boolean
}

export interface AnimeGetByQuery extends HydratedAnime {
  related?: HydratedAnime[]
  dubbers?: DubberCompact[]
  metadata?: Metadata
  posterAdapt?: DubberCompact | null

  /** UTC-0 timestamp of next planned broadcast */
  nextBroadcast?: number | null
}

export interface AnimeGetSearchProps {
  /**
   * Query ~all will return all anime documents in order
   * Query ~wo-mal-id will return anime documents without malId specified (malId = null)
  */
  q: string
}

export interface AnimeGetSearch {
  results: HydratedAnime[]
  extended: {
    dubbedEpisodes: {
      [id: string]: number | null
    }
  }
}


export interface AnimeWithMedia extends Anime {
  videoURL: string
  backgroundURL: string
}

export interface AnimeFeatured {
  headliners: AnimeWithMedia[]
  hot: HydratedAnime[]
  rated: HydratedAnime[]
  updatedRecently: HydratedAnime[]
}

export interface AnimePostProps {
  nameEng: string
}

export interface AnimeDeleteByUuidProps {
  uuid: string
}

export interface AnimePutPosterProps {
  file: Express.Multer.File
  user: User

  /** Anime uuid */
  uuid: string
}

export interface AnimePutPoster {
  url: string
}