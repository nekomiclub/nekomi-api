import { ISODateString } from './types';
import { TeamId } from './BrandedIds';



export enum ADMIN_SLUG {
  /** @private do not use anywhere else except AdminRepository */
  BLANK = 'admin:__blank',

  HOME_FEED = 'admin:home_feed',
  TEAMS_MAP = 'admin:dubbers_map',
  POSTER_LOCALE_MAP = 'admin:poster_locale_map'
}



interface IAdmin<S extends ADMIN_SLUG, D> {
  id: string
  slug: S
  updated_at: ISODateString
  created_at: ISODateString
  data: D
}



export interface IAdminTeamMapData {
  dubber_id: TeamId | null
  subtitles: boolean
  synonyms: string[]
}

export type AdminTeamsMapType = IAdmin<ADMIN_SLUG.TEAMS_MAP, IAdminTeamMapData[]>



export interface IAdminPosterLocaleMapData {
  dubber_id: string | null
  synonym: string[]
}

export type AdminPosterLocaleMapType = IAdmin<ADMIN_SLUG.POSTER_LOCALE_MAP, IAdminPosterLocaleMapData[]>



export default IAdmin;