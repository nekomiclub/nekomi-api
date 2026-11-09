import z from 'zod';
import { UserMinifiedSchema } from './user.schema.js';

/* --------------------- */
/* Enums                 */
/* --------------------- */

export const TEAM_ROLE_ENUM = z.enum({
  LEADER: 'leader',
  EDITOR: 'editor',
  MEMBER: 'member',
  PENDING: 'pending',
});

/* --------------------- */
/* Team member schema    */
/* --------------------- */

export const TeamMemberSchema = z.object({
  id: z.string(),
  role: TEAM_ROLE_ENUM,
  member_since: z.string(),
}).openapi('TeamMember');

export const TeamMemberExtendedSchema = UserMinifiedSchema.extend({
  role: TEAM_ROLE_ENUM,
  member_since: z.string()
}).openapi('TeamMemberExtended');

/* --------------------- */
/* Base schema           */
/* --------------------- */

export const TeamSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  about: z.string().nullable(),

  avatar: z.string(),
  cover: z.string(),

  socials: z.object({
    telegram: z.string().optional(),
    instagram: z.string().optional(),
    youtube: z.string().optional(),
    tiktok: z.string().optional(),
  }),

  support: z.object({
    diaka: z.string().optional(),
    monobank: z.string().optional(),
    privatbank: z.string().optional(),
    bymeacoffee: z.string().optional(),
    patreon: z.string().optional(),
  }),

  members: z.array(TeamMemberSchema),

  created_at: z.string(),
  updated_at: z.string(),
});

/* --------------------- */
/* DTS                   */
/* --------------------- */

export const TeamPublicSchema = TeamSchema.pick({
  id: true,
  slug: true,
  name: true,
  about: true,

  avatar: true,
  cover: true,

  socials: true,
  support: true,

  members: true,

  created_at: true,
  updated_at: true,
}).openapi('Team');

export const TeamMinifiedSchema = TeamSchema.pick({
  id: true,
  slug: true,
  name: true,
  avatar: true,
}).openapi('TeamMinified');

export const TeamSearchResultSchema = TeamMinifiedSchema.extend({
  short_about: z.string().optional()
}).openapi('TeamSearchResult');

/* --------------------- */
/* Inferred types        */
/* --------------------- */

export type TEAM_ROLE_ENUM = z.infer<typeof TEAM_ROLE_ENUM>

export type ITeamMember = z.infer<typeof TeamMemberSchema>
export type ITeamMemberExtended = z.infer<typeof TeamMemberExtendedSchema>

export type ITeam = z.infer<typeof TeamSchema>
export type ITeamPublic = z.infer<typeof TeamPublicSchema>
export type ITeamMinified = z.infer<typeof TeamMinifiedSchema>
export type ITeamSearchResult = z.infer<typeof TeamSearchResultSchema>



export default ITeam;