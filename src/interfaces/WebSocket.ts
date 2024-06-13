export type TWS = 'echo' | 'presence' | 'presence/audience';

export interface IWSPresence {
  sid: string,
  connectedAt: number,
  audience?: number
}

export interface IWS<T> {
  type: TWS,
  payload: T
}