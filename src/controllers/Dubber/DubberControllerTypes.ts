import Dubber from '~/core/interfaces/Dubber.intf';
import User from '~/core/interfaces/User.intf';
import { HydratedAnime } from '~/core/interfaces/Anime.intf';
import { Metadata } from '~/core/interfaces/types';



export interface DubberGetOneByQueryProps {
  query: string
  detailed?: boolean
  fetchDubbedAnime?: boolean
  parseMembers?: boolean

  /** Fetch only dubber metadata, will set dubber to null */
  metadataOnly?: boolean

  /** Use cache
   * @default true
   */
  useCache?: boolean
}

export interface DubberGetOneByQuery {
  dubber: Dubber

  dubbedHydratedAnimes?: HydratedAnime[]
  metadata?: Metadata
  parsedMembers?: User[]
}

export interface DubberGetSearchProps {
  /** Query ~all will return all dubbers */
  q: string
}

export interface DubberGetSearch {
  results: Dubber[]
}