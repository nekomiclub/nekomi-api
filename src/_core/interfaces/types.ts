import { ANIME_MEDIA_TYPE, ANIME_RATE, ANIME_STATUS } from './Anime.intf';
import { TRoleCapability } from '~/core/interfaces/Role.intf';

/** Make single key in T optional */
export type SinglePartial<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export const DaysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
export type DayOfWeek = typeof DaysOfWeek[number];

/** @deprecated use MockID instead */
export type TMockID =
  /** Mocks fk-authority/verify endpoint */
  | 'FkAuthorityVerify'
  | 'FkUsapiAuthRefresh'

/** Mock interface @deprecated use Mock instead */
export interface IMock<T = any> {
  /** Mock ID. */
  id: TMockID

  /** Mock response code. > 400 will throw an error */
  code: number

  /** Mock payload */
  data: T
}

/** FkUsapiAuthRefresh mock @deprecated use CheckCSRFMock instead */
export interface IM_FkUsapiAuthRefresh {
  id: string
  capabilities: TRoleCapability[]
  username: string
  avatar: string
}

/** FkAuthorityVerify mock @deprecated use CheckAccessMock instead */
export interface IM_FkAuthorityVerify {
  verified: boolean

  /** CSRF origin */
  origin: string
}

export const NOTIFY_EVENTS = [
  'new_episode',
  'airing_started',

  'dubber_invite_pending',
  'dubber_invite_accepted',
  'dubber_invite_declined',
  'dubber_member_excluded',
] as const;

export type TNotifyEvent = typeof NOTIFY_EVENTS[number];

export interface IEventPayload<P = object> {
  event: TNotifyEvent
  payload: P
}

/** new_episode */
export interface INotifyNewEpisode {
  titleID: string
  dubberID: string
  episodeOrder: number
}

/** airing_started */
export interface INotifyAiringStarted {
  titleID: string
}

/** dubber_invite accept & decline & pending, dubber_member_excluded */
export interface INotifyDubberTell {
  userId: string
  dubberId: string
}

export interface ServiceControls<CREATE, OUT_DOC> {
  /** Create the document */
  create(props: CREATE): Promise<OUT_DOC>

  /** Delete the document */
  deleteOne(id: string): Promise<void>

  /** Delete many documents with same id */
  deleteMany(id: string): Promise<void>

  /** Get document by id */
  getById(id: string, details?: boolean): Promise<OUT_DOC>

  /** Get document by slug, code, etc */
  getByQuery(query: string, details?: boolean): Promise<OUT_DOC>

  /** getByQuery with built-in trycatch */
  safeGetByQuery(query: string, details?: boolean): Promise<OUT_DOC | null>

  /** Get list of all documents */
  getAll(details?: boolean): Promise<OUT_DOC[]>
}

/** {@link https://github.com/SuperMarcus/myanimelist-api-specification?tab=readme-ov-file#animeobject | specs} */
export interface MyAnimeListNode {
  id: number
  title: string

  media_type?: ANIME_MEDIA_TYPE
  num_episodes?: number
  rating?: ANIME_RATE
  status?: ANIME_STATUS
  synopsis?: string

  main_picture: {
    medium: string
    large: string
  }

  studios?: {
    id: number
    name: string
  }[]

  genres?: {
    id: number
    name: string
  }[]

  /** Score */
  mean?: number

  /** Scored by */
  num_scoring_users?: number

  broadcast?: {
    day_of_the_week: DayOfWeek

    /** e.g 12:30 */
    start_time: string
  }

  related_anime?: {
    node: MyAnimeListNode
  }[],

  alternative_titles?: {
    en: string
    ja: string
    synonyms: string[]
  }
}

export type MyAnimeListNodeFieldType = keyof MyAnimeListNode;

export interface Metadata {
  title: string
  description: string
  keywords: string[]
  photo: string
}