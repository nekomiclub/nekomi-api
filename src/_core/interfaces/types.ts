import { TRoleCapability } from '~/core/interfaces/RoleIntf';

/** Make single key in T optional */
export type SinglePartial<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type TMockID =
  /** Mocks fk-authority/verify endpoint */
  | 'FkAuthorityVerify'
  | 'FkUsapiAuthRefresh'

/** Mock interface */
export interface IMock<T = any> {
  /** Mock ID. */
  id: TMockID

  /** Mock response code. > 400 will throw an error */
  code: number

  /** Mock payload */
  data: T
}


/** FkUsapiAuthRefresh mock */
export interface IM_FkUsapiAuthRefresh {
  id: string
  capabilities: TRoleCapability[]
  username: string
  avatar: string
}

/** FkAuthorityVerify mock */
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
  /** Get list of all documents */
  getAll(details?: boolean): Promise<OUT_DOC[]>
}