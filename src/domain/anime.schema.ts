import z from 'zod';
import { ANIME_GENRE, ANIME_RATING, ANIME_SEASON, ANIME_STATUS, ANIME_TYPE, AnimeDescribedRecord, AnimeNamedRecordSchema } from '~/data/AnimePrimitives.js';

/* --------------------- */
/* Poster & Screenshots  */
/* --------------------- */

export const AnimePosterNodeSchema = z.object({
  small: z.string(),
  medium: z.string(),
  original: z.string(),

  authorId: z.string().nullish(),
  is_hero: z.boolean(),
  pull_hash: z.string(),

  _unprocessedAuthorName: z.string().nullish(),
});

/** Anime poster node schema with omitted internal info */
export const AnimePosterNodePublicSchema = AnimePosterNodeSchema.omit({
  pull_hash: true,
  _unprocessedAuthorName: true
}).openapi('AnimePoster');

export const AnimeScreenshotNodeSchema = z.object({
  preview: z.string(),
  original: z.string(),
  pull_hash: z.string(),
});

/** Anime screenshot node schema with omitted internal info */
export const AnimeScreenshotNodePublicSchema = AnimeScreenshotNodeSchema.omit({
  pull_hash: true,
}).openapi('AnimeScreenshot');

/* --------------------- */
/* Relations & Studios   */
/* --------------------- */

export const AnimeRelationSchema = z.object({
  mal_id: z.number(),
  type: z.string(),
  relation: z.string(),
}).openapi('AnimeRelation');

export const AnimeStudioSchema = z.object({
  mal_id: z.number(),
  name: z.string(),
}).openapi('AnimeStudio');

/* --------------------- */
/* Player schemas        */
/* --------------------- */

export const AnimePlayerVODSchema = z.object({
  episode: z.number(),

  moonanime_vod: z.string().optional(),
  ashdi_vod: z.string().optional(),
  tortuga_vod: z.string().optional(),
}).openapi('AnimePlayerVOD');

export const AnimePlayerTeamSchema = z.object({
  id: z.string(),
  dubber_ids: z.string().array(),
  dubber_name: z.string(),
  vods: AnimePlayerVODSchema.array(),
}).openapi('AnimePlayerTeam');

export const AnimePlayerSchema = z.object({
  dubbed: AnimePlayerTeamSchema.array(),
  subbed: AnimePlayerTeamSchema.array(),
}).openapi('AnimePlayer');

/* --------------------- */
/* Episodes & Schedule   */
/* --------------------- */

export const AnimeEpisodeSchema = z.object({
  episode: z.number(),
  title: z.string(),
  aired: z.string().nullable(),
  score: z.number().nullable(),
  filler: z.boolean(),
  recap: z.boolean(),
}).openapi('AnimeEpisode');

export const AnimeScheduleSchema = z.object({
  episode: z.number(),
  airing_at: z.string(),
}).openapi('AnimeSchedule');

/* --------------------- */
/* Base schema           */
/* --------------------- */

export const AnimeSchema = z.object({
  id: z.string(),

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

  genres: z.nativeEnum(ANIME_GENRE).openapi('ANIME_GENRE_ENUM').array(),
  rating: z.nativeEnum(ANIME_RATING).openapi('ANIME_RATING_ENUM').nullable(),
  status: z.nativeEnum(ANIME_STATUS).openapi('ANIME_STATUS_ENUM').nullable(),
  season: z.nativeEnum(ANIME_SEASON).openapi('ANIME_SEASON_ENUM').nullable(),
  type: z.nativeEnum(ANIME_TYPE).openapi('ANIME_TYPE_ENUM').nullable(),

  content_season: z.number().nullable(),

  updated_at: z.string(),
  created_at: z.string(),

  about_synced_at: z.string().nullable(),
  episodes_synced_at: z.string().nullable(),

  is_DMCA_restricted: z.boolean().optional(),
});

/* --------------------- */
/* DTS                   */
/* --------------------- */

export const AnimePublicSchema = AnimeSchema.pick({
  id: true,
  mal_id: true,
  imdb_id: true,
  slug: true,
  hikka_slug: true,
  year: true,
  episodes_total: true,
  episodes_released: true,
  title_en: true,
  title_ja: true,
  title_ua: true,
  title_synonims: true,
  synopsis_en: true,
  synopsis_ua: true,
  score: true,
  scored_by: true,
  studios: true,
  schedule: true,

  updated_at: true,
  created_at: true,

  about_synced_at: true,
  episodes_synced_at: true,

  is_DMCA_restricted: true,
}).extend({
  poster: z.string(),
  type: AnimeNamedRecordSchema.openapi('AnimeType').nullish(),
  season: AnimeNamedRecordSchema.openapi('AnimeSeason').nullish(),
  status: AnimeNamedRecordSchema.openapi('AnimeStatus').nullish(),
  rating: AnimeDescribedRecord.openapi('AnimeRating').nullish(),
  genres: AnimeDescribedRecord.openapi('AnimeGenre').array(),
}).openapi('Anime');

export const AnimeMinifiedSchema = AnimeSchema.pick({
  id: true,
  slug: true,
  episodes_total: true,
  episodes_released: true,
  score: true,
}).extend({
  title: z.string(),
  poster: z.string(),
  genres: AnimeDescribedRecord.array()
}).openapi('AnimeMinified');

export const AnimeExtendedSchema = AnimeMinifiedSchema.extend({
  year: z.number().nullable(),
  short_synopsys: z.string().optional(),
  subtitle: z.string().nullish(),
  type: AnimeNamedRecordSchema.optional(),
  season: AnimeNamedRecordSchema.optional(),
  status: AnimeNamedRecordSchema.optional(),
  rating: AnimeDescribedRecord.optional(),
  genres: AnimeDescribedRecord.array(),
}).openapi('AnimeExtended');

export const AnimeSearchResultSchema = AnimeSchema.pick({
  id: true,
  slug: true,
  title_ua: true,
  title_en: true,
  score: true,
  episodes_released: true,
  episodes_total: true,
  year: true,
}).extend({
  poster: z.string(),
  type: AnimeNamedRecordSchema.optional(),
}).openapi('AnimeSearchResult');

/* --------------------- */
/* Inferred types        */
/* --------------------- */

export type IAnimePosterNode = z.infer<typeof AnimePosterNodeSchema>
export type IAnimePosterNodePublic = z.infer<typeof AnimePosterNodePublicSchema>
export type IAnimeScreenshotNode = z.infer<typeof AnimeScreenshotNodeSchema>
export type IAnimeScreenshotNodePublic = z.infer<typeof AnimeScreenshotNodePublicSchema>

export type IAnimeRelation = z.infer<typeof AnimeRelationSchema>
export type IAnimeStudio = z.infer<typeof AnimeStudioSchema>

export type IAnimePlayerVOD = z.infer<typeof AnimePlayerVODSchema>
export type IAnimePlayerTeam = z.infer<typeof AnimePlayerTeamSchema>
export type IAnimePlayer = z.infer<typeof AnimePlayerSchema>

export type IAnimeEpisode = z.infer<typeof AnimeEpisodeSchema>
export type IAnimeSchedule = z.infer<typeof AnimeScheduleSchema>

export type IAnime = z.infer<typeof AnimeSchema>
export type IAnimeMinified = z.infer<typeof AnimeMinifiedSchema>
export type IAnimeExtended = z.infer<typeof AnimeExtendedSchema>
export type IAnimeSearchResult = z.infer<typeof AnimeSearchResultSchema>



export default IAnime;