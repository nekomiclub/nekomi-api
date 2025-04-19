import Anime, { AnimeEpisode, HydratedAnime } from '~/core/interfaces/Anime.intf';
import User from '~/core/interfaces/User.intf';
import { AnimeEpisodeQualityType } from '~/core/interfaces/API/NekomiUploadsAPI';
import { DubberCompact } from '~/core/interfaces/Dubber.intf';
import { Metadata } from '~/core/interfaces/types';
import { z } from 'zod';



export interface AnimeGetStats {
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

export interface AnimeDeleteEpisodeProps {
  uuid: string
  dubberId: string
  order: number
  user: User
}

export interface AnimePostEpisodeProps {
  uuid: string
  file: Express.Multer.File
  user: User
  order: number
  dubberId: string
  qualities: AnimeEpisodeQualityType[]
}

export interface AnimePostEpisode {
  episode: AnimeEpisode
}



export const AnimePatchByUuidSchema = z.object({
  uuid: z.string(),

  nameUkr: z.string().optional(),
  nameEng: z.string().optional(),
  nameAlt: z.string().array().optional(),

  malId: z.number().optional(),
  scoreIMDB: z.number().optional(),
  scoreMAL: z.number().optional(),
  malScoredBy: z.number().optional(),
  episodesCount: z.number().optional(),
  year: z.number().optional(),
  studios: z.string().array().optional(),
  genres: z.string().array().optional(),
  posterAdapt: z.string().optional(),

  status: z.string().optional(),
  season: z.string().optional(),
  media: z.string().optional(),
  rate: z.string().optional(),

  details: z.string().optional(),
  description: z.string().optional(),
});

export type AnimePatchByUuidProps = z.infer<typeof AnimePatchByUuidSchema>