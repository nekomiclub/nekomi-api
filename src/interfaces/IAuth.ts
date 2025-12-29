import { ISODateString } from './types';



export enum AUTH_METHOD {
  GOOGLE = 'provider:google'
}



export interface ISessionToken {
  user_id: string;
  session_id: string;
  created_at: ISODateString;
}
