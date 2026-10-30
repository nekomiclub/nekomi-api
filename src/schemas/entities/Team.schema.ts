import z from 'zod';
import { asCDNString, asISODateString, asTeamId, asUserId } from '~/intf/BrandedIds';

/* --------------------- */
/* Native enum           */
/* --------------------- */

export const TeamRoleSchema = z.enum([
  'leader',
  'editor',
  'member',
  'pending',
]).openapi('TeamRole');

/* --------------------- */
/* Team member schema    */
/* --------------------- */

export const TeamMemberSchema = z.object({
  id: z.string().transform(asUserId),
  role: TeamRoleSchema,
  member_since: z.string().transform(asISODateString),
}).openapi('TeamMember');

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
}).openapi('Team');

/* --------------------- */
/* DTS                   */
/* --------------------- */

export const TeamMinifiedSchema = TeamSchema.pick({
  id: true,
  slug: true,
  name: true,
  avatar: true,
}).openapi('TeamMinified');



/* --------------------- */
/* Inferred types        */
/* --------------------- */

export type TeamRoleType = z.infer<typeof TeamRoleSchema>

export type ITeamMember = z.infer<typeof TeamMemberSchema>

export type ITeam = z.infer<typeof TeamSchema>

export type ITeamMinified = z.infer<typeof TeamMinifiedSchema>



export default ITeam;