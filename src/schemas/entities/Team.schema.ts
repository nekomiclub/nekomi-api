import z from 'zod';
import { UserMinifiedSchema } from './User.schema';
import { asCDNString, asISODateString, asTeamId, asUserId } from '~/intf/BrandedIds';



/* --------------------- */
/* Native enum           */
/* --------------------- */

export const TEAM_ROLE_ENUM = z.enum([
  'leader',
  'editor',
  'member',
  'pending',
]).openapi('TEAM_ROLE_ENUM');

/* --------------------- */
/* Team member schema    */
/* --------------------- */

export const TeamMemberSchema = z.object({
  id: z.string().transform(asUserId),
  role: TEAM_ROLE_ENUM,
  member_since: z.string().transform(asISODateString),
}).openapi('TeamMember');

export const TeamMemberExtendedSchema = UserMinifiedSchema.extend({
  role: TEAM_ROLE_ENUM,
  member_since: z.string().transform(asISODateString)
}).openapi('TeamMemberExtended');

/* --------------------- */
/* Base team schema      */
/* --------------------- */

export const TeamSchema = z.object({
  id: z.string().transform(asTeamId),
  slug: z.string(),
  name: z.string(),
  about: z.string().nullable(),

  avatar: z.string().transform(asCDNString),
  cover: z.string().transform(asCDNString),

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

  created_at: z.string().transform(asISODateString),
  updated_at: z.string().transform(asISODateString),
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



/* --------------------- */
/* Inferred types        */
/* --------------------- */

export type TeamRoleType = z.infer<typeof TEAM_ROLE_ENUM>

export type ITeamMember = z.infer<typeof TeamMemberSchema>
export type ITeamMemberExtended = z.infer<typeof TeamMemberExtendedSchema>

export type ITeam = z.infer<typeof TeamSchema>
export type ITeamPublic = z.infer<typeof TeamPublicSchema>

export type ITeamMinified = z.infer<typeof TeamMinifiedSchema>



export default ITeam;