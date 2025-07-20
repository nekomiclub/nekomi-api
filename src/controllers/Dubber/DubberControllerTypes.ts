import Dubber from '~/core/interfaces/Dubber.intf';
import User from '~/core/interfaces/User.intf';
import { HydratedAnime } from '~/core/interfaces/Anime.intf';
import { z } from 'zod';



export interface DubberGetOneByQueryProps {
  query: string
  detailed?: boolean
  fetchDubbedAnime?: boolean
  parseMembers?: boolean

  /** Use cache
   * @default true
   */
  useCache?: boolean
}

export interface DubberGetOneByQuery {
  dubber: Dubber

  dubbedHydratedAnimes?: HydratedAnime[]
  parsedMembers?: User[]
}

export interface DubberGetSearchProps {
  /** Query ~all will return all dubbers */
  q: string
}

export interface DubberGetSearch {
  results: Dubber[]
}



export const DubberCreateSchema = z.object({
  nameUkr: z.string(),
  nameEng: z.string()
});

export type IDubberCreateProps = z.infer<typeof DubberCreateSchema>

export type IDubberCreate = Dubber