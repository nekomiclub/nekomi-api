import { ISODateString } from './types';



export interface ICSRFAgent {
  id: string
  origin: string
  public_key: string
  created_at: ISODateString
}



export default ICSRFAgent;