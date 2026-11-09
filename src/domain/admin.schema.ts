import z from 'zod';

/* --------------------- */
/* Native enum           */
/* --------------------- */

export enum ADMIN_SLUG {
  /** @private do not use anywhere else except AdminRepository */
  BLANK = 'admin:__blank',

  HOME_FEED = 'admin:home_feed',
  TEAMS_MAP = 'admin:dubbers_map',
  POSTER_LOCALE_MAP = 'admin:poster_locale_map',
}

/* --------------------- */
/* Base schema           */
/* --------------------- */

export const AdminBaseSchema = z.object({
  id: z.string(),
  slug: z.nativeEnum(ADMIN_SLUG),
  updated_at: z.string(),
  created_at: z.string(),
  data: z.unknown(),
});

/* --------------------- */
/* Teams map data        */
/* --------------------- */

export const AdminTeamMapDataSchema = z.object({
  dubber_id: z.string().nullable(),
  subtitles: z.boolean(),
  synonyms: z.string().array(),
});

export const AdminTeamsMapSchema = AdminBaseSchema.extend({
  slug: z.literal(ADMIN_SLUG.TEAMS_MAP),
  data: AdminTeamMapDataSchema.array(),
});

/* --------------------- */
/* Poster locale map     */
/* --------------------- */

export const AdminPosterLocaleMapDataSchema = z.object({
  dubber_id: z.string().nullable(),
  synonym: z.string().array(),
});

export const AdminPosterLocaleMapSchema = AdminBaseSchema.extend({
  slug: z.literal(ADMIN_SLUG.POSTER_LOCALE_MAP),
  data: AdminPosterLocaleMapDataSchema.array(),
});

/* --------------------- */
/* DTS                   */
/* --------------------- */

// <none>

/* --------------------- */
/* Inferred types        */
/* --------------------- */

export type IAdmin<S extends ADMIN_SLUG, D> = {
  id: string
  slug: S
  updated_at: string
  created_at: string
  data: D
}

export type IAdminTeamMapData = z.infer<typeof AdminTeamMapDataSchema>
export type AdminTeamsMapType = z.infer<typeof AdminTeamsMapSchema>

export type IAdminPosterLocaleMapData = z.infer<typeof AdminPosterLocaleMapDataSchema>
export type AdminPosterLocaleMapType = z.infer<typeof AdminPosterLocaleMapSchema>



export default IAdmin;