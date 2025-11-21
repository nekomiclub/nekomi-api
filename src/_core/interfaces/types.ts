import { ANIME_MEDIA_TYPE, ANIME_RATE, ANIME_SEASON, ANIME_STATUS } from './IAnime';
import { z } from 'zod';



export type RepositoryQueriesType<M> = { $or: Partial<Record<keyof M, string>>[] }

export const DaysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
export type DayOfWeek = typeof DaysOfWeek[number];

/** {@link https://github.com/SuperMarcus/myanimelist-api-specification?tab=readme-ov-file#animeobject | specs} */
export interface MyAnimeListNode {
  id: number
  title: string

  media_type?: ANIME_MEDIA_TYPE
  num_episodes?: number
  rating?: ANIME_RATE
  status?: ANIME_STATUS
  synopsis?: string

  main_picture: {
    medium: string
    large: string
  }

  studios?: {
    id: number
    name: string
  }[]

  genres?: {
    id: number
    name: string
  }[]

  /** Score */
  mean?: number

  /** Scored by */
  num_scoring_users?: number

  broadcast?: {
    day_of_the_week: DayOfWeek

    /** e.g 12:30 */
    start_time: string
  }

  related_anime?: {
    node: MyAnimeListNode
  }[],

  alternative_titles?: {
    en: string
    ja: string
    synonyms: string[]
  }
}

/** {@link https://api.hikka.io/docs#/Integrations/mal_anime_integrations_mal_anime__mal_id__get | docs} */
export interface HikkaMALIntegration {
  data_type: string
  media_type: ANIME_MEDIA_TYPE
  title_ua: string
  title_en: string
  title_ja: string
  episodes_released: number
  episodes_total: number
  image: string
  status: ANIME_STATUS
  scored_by: number
  score: number
  slug: string
  start_date: number
  end_date: number
  translated_ua: boolean
  season: ANIME_SEASON
  source: string
  rating: ANIME_RATE
  year: number
}

export interface HikkaAnime {
  title_ua: string
  title_en: string
  title_ja: string
  synonyms: string[]
  synopsis_ua: string | null
  synopsis_en: string
  // ... 
}

export const ZodBooleanish = z.string().refine((value) => value === 'true' || value === 'false', {
  message: 'Value must be a boolean',
}).transform((value) => value === 'true');