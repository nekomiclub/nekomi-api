import z from 'zod';

/* --------------------- */
/* Enums                 */
/* --------------------- */

export const ADMIN_SLUG_ENUM = z.enum({
  /** @private do not use anywhere else except AdminRepository */
  BLANK: 'admin:__blank',

  HOME_FEED: 'admin:home_feed',
  TEAMS_MAP: 'admin:dubbers_map',
  POSTER_LOCALE_MAP: 'admin:poster_locale_map',
}).openapi('ADMIN_SLUG_ENUM');

/* --------------------- */
/* Base schema           */
/* --------------------- */

export const AdminBaseSchema = z.object({
  id: z.string(),
  slug: ADMIN_SLUG_ENUM,
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
  slug: ADMIN_SLUG_ENUM.enum.TEAMS_MAP,
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
  slug: ADMIN_SLUG_ENUM.enum.POSTER_LOCALE_MAP,
  data: AdminPosterLocaleMapDataSchema.array(),
});

/* --------------------- */
/* Inferred types        */
/* --------------------- */

export type ADMIN_SLUG_ENUM = z.infer<typeof ADMIN_SLUG_ENUM>

export type AdminEntity<S extends ADMIN_SLUG_ENUM, D> = {
  id: string
  slug: S
  updated_at: string
  created_at: string
  data: D
}

export type AdminEntityTeamMapData = z.infer<typeof AdminTeamMapDataSchema>
export type AdminEntityTeamsMap = z.infer<typeof AdminTeamsMapSchema>

export type AdminEntityPosterLocaleMapData = z.infer<typeof AdminPosterLocaleMapDataSchema>
export type AdminEntityPosterLocaleMap = z.infer<typeof AdminPosterLocaleMapSchema>



export default AdminEntity;