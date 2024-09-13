/** Dubber interface */
export interface IDubber {
  id: string
  code: string
  name: string

  /** Avatar
   * @deprecated use avatar instead
   */
  thumbURL: string

  /** Avatar URL
   * @since 1.3.0 migrated thumbURL
   */
  avatar: string

  /** Creation UTC-0 timestamp */
  createdAt: number

  /** Description */
  description: string | null

  /** Leader ID */
  leader: string | null

  /** Editors IDs */
  editors: string[]

  /** Members IDs */
  members: string[]

  /** Members invite pending
   * @since 1.3.0
   */
  membersInvitePending: string[]

  /** Rating
   * @deprecated outdated
   */
  rating: number

  /** Social links */
  socials: {
    telegram: string | null
    instagram: string | null
    youtube: string | null
    tiktok: string | null
  }

  /** Support links */
  support: {
    diaka: string | null
    monobank: string | null
    privatbank: string | null
    bymeacoffee: string | null
    patreon: string | null
  }
}