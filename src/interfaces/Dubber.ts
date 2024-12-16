export type TDubberMemberRole = 'leader' | 'editor' | 'member'

/** Dubber interface */
export interface IDubber {
  id: string
  slug: string
  avatar: string
  description: string | null
  members: IDubberMember[]

  /** Invited members IDs */
  membersInvited: string[]


  /** @since 1.3.2 */
  banner: string

  /** @since 1.3.2 */
  nameUkr: string

  /** @since 1.3.2 */
  nameEng: string



  statistics: {
    /** Creation UTC0 timestamp */
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

  /** @deprecated use name_ukr instead */
  name: string

  /** @deprecated use slug instead */
  code: string
}

export interface IDubberMember {
  id: string
  role: TDubberMemberRole

  /** Member since UTC0 timestamp */
  memberSince: number
}