import mongoose, { Schema } from 'mongoose';



export type DubberRoleTypeOld = 'leader' | 'editor' | 'member'

export interface DubberOld {
  id: string
  slug: string
  avatar: string
  description: string | null
  banner: string
  nameEng: string
  nameUkr: string

  /** @private */
  members: DubberMemberOld[]

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

export interface DubberMemberOld {
  id: string
  role: DubberRoleTypeOld

  /** UTC-0 timestamp */
  memberSince: number
}

export interface DubberCompactOld {
  id: string
  slug: string
  nameUkr: string
  nameEng: string
  avatarURL: string
}




/** @private DO NOT USE IT ANYWHERE ELSE EXCEPT DUBBER SERVICE */
export const DubberModelOld = mongoose.model<DubberOld>('dubbers_olds', new Schema({
  id: String,
  code: String,
  name: String,
  socials: Object,
  support: Object,
  createdAt: Number,
  description: String,
  members: Array,
  avatar: String,
  membersInvited: Array,
  statistics: Object,
  nameEng: String,
  nameUkr: String,
  slug: String,
  banner: String,
}));

export default DubberModelOld;