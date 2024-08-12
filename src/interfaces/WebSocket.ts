export type TWSType = 'send_presence' | 'disconnect_presence' | 'poll_presence' | 'error';

export interface IWS<T = any> {
  type: TWSType
  payload: T
}

export interface IWSSendPresence {
  /** Client session ID */
  SID: string
}

export interface IWSPollPresence {
  /** Total online SIDs */
  online: number
}