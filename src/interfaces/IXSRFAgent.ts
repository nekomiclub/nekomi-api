import { ISODateString } from './types';



export interface IXSRFAgent {
  id: string
  origin: string
  public_key: string
  created_at: ISODateString
}



export default IXSRFAgent;