import z from 'zod';
import { CDNString, ISODateString } from './types';
import { TeamId, asCDNString, asTeamId } from './BrandedIds';
import { UserId } from './BrandedIds';



export type TeamRoleType = 'leader' | 'editor' | 'member' | 'pending'



export interface ITeam {
  id: TeamId
  slug: string
  name: string
  about: string | null

  avatar: CDNString
  cover: CDNString

  socials: {
    telegram?: string
    instagram?: string
    youtube?: string
    tiktok?: string
  }

  support: {
    diaka?: string
    monobank?: string
    privatbank?: string
    bymeacoffee?: string
    patreon?: string
  }

  members: ITeamMember[]
  created_at: ISODateString
  updated_at: ISODateString
}

export interface ITeamMember {
  id: UserId
  role: TeamRoleType
  member_since: ISODateString
}

export type TeamCardType = Pick<ITeam, 'id' | 'name' | 'slug' | 'avatar'>



export const TeamMinifiedSchema = z.object({
  id: z.string().refine(asTeamId),
  slug: z.string(),
  name: z.string(),
  about: z.string().nullable(),
  avatar: z.string().refine(asCDNString),
});

export default ITeam;