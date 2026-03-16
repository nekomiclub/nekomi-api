import { BrandedId, CDNString, ISODateString } from './types';
import { UserId } from './IUser';
import { asBrandedId } from './types';



export type TeamRoleType = 'leader' | 'editor' | 'member' | 'pending'
export type TeamId = BrandedId<string, 'teamId'>;



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

  members: ITeamMember[] // Protected
  created_at: ISODateString // Protected
  updated_at: ISODateString // Protected
}

export interface ITeamMember {
  id: UserId
  role: TeamRoleType
  member_since: ISODateString
}

export type TeamCardType = Pick<ITeam, 'id' | 'name' | 'slug' | 'avatar'>



export const asTeamId = (asBrandedId<TeamId>);

export default ITeam;