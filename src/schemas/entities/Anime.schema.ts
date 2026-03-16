import z from 'zod';
import { ANIME_GENRE, ANIME_RATING, ANIME_SEASON, ANIME_STATUS, ANIME_TYPE, AnimeGenreType } from '~/data/AnimePrimitives';
import { CDNString, asAnimeId, asCDNString, asISODateString, asTeamId } from '~/intf/BrandedIds';

/* --------------------- */
/* Poster & Screenshots  */
/* --------------------- */

export const AnimePosterNodeSchema = z.object({
  small: z.string().transform(asCDNString),
  medium: z.string().transform(asCDNString),
  original: z.string().transform(asCDNString),

  authorId: z.string().nullable(),
  is_hero: z.boolean(),
  pull_hash: z.string(),

  _unprocessedAuthorName: z.string().optional(),
});

export const AnimeScreenshotNodeSchema = z.object({
  preview: z.string().transform(asCDNString),
  original: z.string().transform(asCDNString),
  pull_hash: z.string(),
});

/* --------------------- */
/* Relations & Studios   */
/* --------------------- */

export const AnimeRelationSchema = z.object({
  mal_id: z.number(),
  type: z.string(),
  relation: z.string(),
});

export const AnimeStudioSchema = z.object({
  mal_id: z.number(),
  name: z.string(),
});

/* --------------------- */
/* Player schemas        */
/* --------------------- */

export const AnimePlayerVODSchema = z.object({
  episode: z.number(),

  moonanime_vod: z.string().optional(),
  ashdi_vod: z.string().optional(),
  tortuga_vod: z.string().optional(),
});

export const AnimePlayerTeamSchema = z.object({
  id: z.string(),
  dubber_ids: z.string().transform(asTeamId).array(),
  dubber_name: z.string(),
  vods: AnimePlayerVODSchema.array(),
});

export const AnimePlayerSchema = z.object({
  dubbed: AnimePlayerTeamSchema.array(),
  subbed: AnimePlayerTeamSchema.array(),
});

/* --------------------- */
/* Episodes & Schedule   */
/* --------------------- */

export const AnimeEpisodeSchema = z.object({
  episode: z.number(),
  title: z.string(),
  aired: z.string().transform(asISODateString).nullable(),
  score: z.number().nullable(),
  filler: z.boolean(),
  recap: z.boolean(),
});

export const AnimeScheduleSchema = z.object({
  episode: z.number(),
  airing_at: z.string().transform(asISODateString),
});

/* --------------------- */
/* Base anime schema     */
/* --------------------- */

export const AnimeSchema = z.object({
  id: z.string().transform(asAnimeId),

  mal_id: z.number().nullable(),
  imdb_id: z.string().nullable(),

  slug: z.string(),
  hikka_slug: z.string().nullable(),

  posters: AnimePosterNodeSchema.array(),

  hero_poster_author: z.string().nullable(),

  year: z.number().nullable(),

  episodes_total: z.number().nullable(),
  episodes_released: z.number().nullable(),

  title_ja: z.string().nullable(),
  title_en: z.string().nullable(),
  title_ua: z.string().nullable(),

  title_synonims: z.string().array(),

  synopsis_en: z.string().nullable(),
  synopsis_ua: z.string().nullable(),

  score: z.number(),
  scored_by: z.number(),

  relations: AnimeRelationSchema.array(),
  studios: AnimeStudioSchema.array(),
  screenshots: AnimeScreenshotNodeSchema.array(),

  schedule: AnimeScheduleSchema.array(),

  player: AnimePlayerSchema,

  episodes_meta: AnimeEpisodeSchema.array(),

  ashdi_url: z.string().nullable(),

  genres: z.nativeEnum(ANIME_GENRE).array(),
  rating: z.nativeEnum(ANIME_RATING).nullable(),
  status: z.nativeEnum(ANIME_STATUS).nullable(),
  season: z.nativeEnum(ANIME_SEASON).nullable(),
  type: z.nativeEnum(ANIME_TYPE).nullable(),

  content_season: z.number().nullable(),

  updated_at: z.string().transform(asISODateString),
  created_at: z.string().transform(asISODateString),

  about_synced_at: z.string().transform(asISODateString).nullable(),
  episodes_synced_at: z.string().transform(asISODateString).nullable(),

  is_DMCA_restricted: z.boolean().optional(),
});

/* --------------------- */
/* Inferred types        */
/* --------------------- */

export type IAnimePosterNode = z.infer<typeof AnimePosterNodeSchema>
export type IAnimeScreenshotNode = z.infer<typeof AnimeScreenshotNodeSchema>

export type IAnimeRelation = z.infer<typeof AnimeRelationSchema>
export type IAnimeStudio = z.infer<typeof AnimeStudioSchema>

export type IAnimePlayerVOD = z.infer<typeof AnimePlayerVODSchema>
export type IAnimePlayerTeam = z.infer<typeof AnimePlayerTeamSchema>
export type IAnimePlayer = z.infer<typeof AnimePlayerSchema>

export type IAnimeEpisode = z.infer<typeof AnimeEpisodeSchema>
export type IAnimeSchedule = z.infer<typeof AnimeScheduleSchema>

export type IAnime = z.infer<typeof AnimeSchema>

/** @deprecated */
export type AnimeCardType = Pick<IAnime, 'id' | 'slug' | 'episodes_total' | 'score'> & {
  title: string
  poster: CDNString
  genres: AnimeGenreType[]
}



export default IAnime;