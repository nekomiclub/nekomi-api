export type TDubberMemberRole = 'leader' | 'editor' | 'member'

export interface IDubber {
  id: string
  slug: string
  avatar: string
  description: string | null
  banner: string
  nameEng: string
  nameUkr: string

  /** @private */
  members: IDubberMember[]

  /** Invited members IDs
   * @private
   */
  membersInvited: string[]


  statistics: {
    /** UTC-0 timestamp */
    createdAt: number
  }

  socials: {
    telegram: string | null
    instagram: string | null
    youtube: string | null
    tiktok: string | null
  }

  support: {
    diaka: string | null
    monobank: string | null
    privatbank: string | null
    bymeacoffee: string | null
    patreon: string | null
  }



  /** Creation UTC0 timestamp
   * @deprecated use statistics.created_at instead
   */
  createdAt: number

  /** @deprecated redundant */
  name: string

  /** @deprecated use slug instead */
  code: string
}

export interface IDubberMember {
  id: string
  role: TDubberMemberRole

  /** UTC-0 timestamp */
  memberSince: number
}

export interface DubberMetadata {
  id: string
  slug: string
  nameUkr: string
  nameEng: string
  avatarURL: string
}



export default IDubber;