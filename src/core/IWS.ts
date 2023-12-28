export type TWS = 'echo' | 'presence';

export interface IWSPresence {
  sid: string,
  connectedAt: number,
  audience?: number
}

export interface IWS<T> {
  type: TWS,
  payload: T
}