import { TRoleCapability } from '~/interfaces/Role.intf';


export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';



//* ============================= MOCKING
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



//* ============================= NOTIFY
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

//* --------- EVENTS

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