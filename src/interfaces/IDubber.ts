import { CDNString, ISODateString } from './types';



export type DubberRoleType = 'leader' | 'editor' | 'member' | 'pending'



export interface IDubber {
  id: string
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

  members: IDubberMember[] // Protected
  created_at: ISODateString // Protected
  updated_at: ISODateString // Protected
}

export interface IDubberMember {
  id: string
  role: DubberRoleType
  member_since: ISODateString
}

export type DubberCardType = Pick<IDubber, 'id' | 'name' | 'slug' | 'avatar'>



export default IDubber;