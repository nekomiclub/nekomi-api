import IDubber from '~/core/interfaces/DubberIntf';
import User from '~/core/interfaces/UserIntf';
import { HydratedAnime } from '~/core/interfaces/AnimeIntf';
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
  dubber: IDubber

  dubbedHydratedAnimes?: HydratedAnime[]
  metadata?: Metadata
  parsedMembers?: User[]
}