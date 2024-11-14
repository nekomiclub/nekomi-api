import { WebSocketExtended } from './globals';

export const WS_REQUEST_TYPES = [
  'ping',
  'site_connected',
  'site_disconnected',
  'online_poll',
] as const;

export const WS_RESPONSE_TYPES = [
  'pong',
  'ok',
  'error',
  'online_changed',
] as const;

export const WS_TYPES = [...WS_REQUEST_TYPES, ...WS_RESPONSE_TYPES] as const;

export type TWS_Type = typeof WS_TYPES[number];
export type TWS_Request = typeof WS_REQUEST_TYPES[number];
export type TWS_Response = typeof WS_RESPONSE_TYPES[number];

/** Websocket default message */
export interface Message<T = TWS_Type, P = object> {
  type: T
  payload: P
  CSRF?: string
  Authorization?: string
}

export type Request<P = { message: string }> = Message<TWS_Request, P>
export type Response<P = { message: string }> = Message<TWS_Response, P>



export interface IWS_Route {
  ws: WebSocketExtended
  message: Message
}


/** 
 * Site connect/disconnect
 * Implements site_connected & site_disconnected methods
*/
export interface IWS_SiteConnection {
  /** Client session ID */
  SID: string
}

/** 
 * Site online changed
 * Implement online_changed method
 */
export interface IWS_OnlineChanged {
  online: number
}