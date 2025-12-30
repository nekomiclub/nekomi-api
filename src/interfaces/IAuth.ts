import { ISODateString } from './types';



export enum AUTH_METHOD {
  GOOGLE = 'provider:google'
}



export interface ISessionToken {
  token_id: string
  user_id: string
  session_id: string
  created_at: ISODateString
}

export interface ICSRFToken {
  token_id: string
  origin: string
  created_at: ISODateString
}

