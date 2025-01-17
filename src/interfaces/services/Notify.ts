import { IDubber } from '~/core/interfaces/IDubber';
import { ITitle } from '../Title';

export const NOTIFY_EVENTS = [
  'new_episode',
  'airing_started',
  'dubber_invite_pending',
  'dubber_invite_accepted',
  'dubber_invite_declined',
  'dubber_member_excluded',
] as const;

export type TNotifyEvent = typeof NOTIFY_EVENTS[number];

export interface INotifyBroadcast<PARTICIPANTS = string[], DATA = object> {
  event: TNotifyEvent
  participants: PARTICIPANTS
  data: DATA
}

export interface IEventPayload<P = object> {
  event: TNotifyEvent
  payload: P
}

//* --------- EVENTS

/** new_episode event */
export interface INotifyNewEpisode {
  titleID: string
  dubberID: string
  episodeOrder: number
}

/** new_episode event broadcasted */
export type TNotifyBroadcastNewEpisode = INotifyBroadcast<number[], {
  title: ITitle
  dubber: IDubber
  episodeOrder: number
}>

/** airing_started */
export interface INotifyAiringStarted {
  titleID: string
}

/** airing_started event broadcasted */
export type TNotifyBroadcastAiringStarted = INotifyBroadcast<number[], {
  title: ITitle
}>

/** dubber_invite_pending */
export interface INotifyDubberInvite {
  user_id: string
  dubber_id: string
}

/** dubber_invite_pending event broadcasted */
export type TNotifyBroadcastDubberInvite = INotifyBroadcast<number[], {
  dubber: IDubber
}>