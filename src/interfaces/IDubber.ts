import { CDNString, ISODateString } from './types';



export type DubberRoleType = 'leader' | 'editor' | 'member' | 'pending'



export interface IDubber {
  id: string
  slug: string

  avatar: CDNString
  cover: CDNString

  about: string | null
  name: string

  members: IDubberMember[] // Private

  created_at: ISODateString
  updated_at: ISODateString

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
}

export interface IDubberMember {
  id: string
  role: DubberRoleType
  member_since: ISODateString
}



export default IDubber;