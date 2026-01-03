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
 * Admin dubbers map data node
 * 
 * @param key dubber id (can be ~notexist{x} is dubber is not exist)
 */
export type AdminDubberMapDataType = Record<string, {
  synonyms_dub: string[]
  synonyms_sub: string[]
}>

export type AdminDubbersMapType = IAdmin<ADMIN_SLUG.DUBBERS_MAP, AdminDubberMapDataType>



export default IAdmin;