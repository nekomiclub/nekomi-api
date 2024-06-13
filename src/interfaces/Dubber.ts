/** Dubber interface */
export interface IDubber {
  /** ID */
  id: string

  /** Code */
  code: string

  /** Title */
  name: string

  /** Avatar */
  thumbURL: string

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

  /** Creation timestamp */
  createdAt: number

  /** Description */
  description: string | null

  /** Leader */
  leader: string | null

  /** Editors */
  editors: string[] | null

  /** Members */
  members: string[] | null

  /** Rating */
  rating: number
}