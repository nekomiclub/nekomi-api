import { ISODateString } from './types';



export enum ADMIN_SLUG {
  /** @private do not use anywhere else except AdminRepository */
  BLANK = 'admin:__blank',

  HOME_FEED = 'admin:home_feed',
  DUBBERS_MAP = 'admin:dubbers_map',
}



interface IAdmin<S extends ADMIN_SLUG, D> {
  id: string
  slug: S
  updated_at: ISODateString
  created_at: ISODateString
  data: D
}



/** 
 * Admin dubber map data
 * 
 * @param key dubber id
 * @param valu dubber names array
 */
export type AdminDubberMapData = Record<string, string[]>
export type AdminDubbersMapType = IAdmin<ADMIN_SLUG.DUBBERS_MAP, AdminDubberMapData>



export default IAdmin;