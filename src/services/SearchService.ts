import AnimeModel from '~/core/models/AnimeModel';
import DocumentDTO from '~/core/services/DTOService';
import DubberService from '~/core/services/DubberService';
import Fuse from 'fuse.js';
import UserModel from '~/core/models/UserModel';
import { Anime } from '~/core/interfaces/Anime.intf';
import { E500 } from './ErrorService';
import { IDubber } from '~/core/interfaces/Dubber.intf';
import { Logger } from './LoggerService';
import { User } from '~/core/interfaces/User.intf';



interface SearchProps {
  query: string
  engine: SearchEngineType

  /** @default 10 */
  limit?: number
}

export type SearchEngineType = 'user' | 'dubber' | 'anime';



class SearchService {
  private UserEngine: Fuse<User> | null = null;
  private DubberEngine: Fuse<IDubber> | null = null;
  private AnimeEngine: Fuse<Anime> | null = null;



  async init() {
    await Promise.all([
      this.update('user'),
      this.update('dubber'),
      this.update('anime'),
    ]);
  }

  /** Update search engine */
  async update(type: SearchEngineType) {
    if (type === 'user') {
      const list = (await UserModel.find()).map(doc => DocumentDTO.user(doc, true));

      const keys: (keyof User)[] = [
        'id',
        'username',
      ];

      this.UserEngine = new Fuse(list, {
        keys,
        shouldSort: true,
        ignoreLocation: true
      });
    } else if (type === 'dubber') {
      const list = await new DubberService().getAll(true);

      const keys: (keyof IDubber)[] = [
        'id',
        'slug',
        'nameEng',
        'nameUkr'
      ];

      this.DubberEngine = new Fuse(list, {
        keys,
        shouldSort: true,
        ignoreLocation: true
      });
    } else if (type === 'anime') {
      const list = (await AnimeModel.find()).map(doc => DocumentDTO.anime(doc, true));

      this.AnimeEngine = new Fuse(list, {
        keys: ['names.eng', 'names.ukr', 'names.alt', 'code', 'id'],
        shouldSort: true,
        ignoreLocation: true
      });
    } else throw new E500(`[SearchService]: Can not update not exist engine - ${type}`);

    Logger.debug(`[SearchService]: Engine updated. [engine: ${type}]`);
  }

  search({ limit, query, engine }: SearchProps) {
    limit = limit ?? 10;
    let SearchEngine: Fuse<any>;

    if (engine === 'user') {
      if (!this.UserEngine) throw new E500('Search not ready');
      SearchEngine = this.UserEngine;
    } else if (engine === 'dubber') {
      if (!this.DubberEngine) throw new E500('Search not ready');
      SearchEngine = this.DubberEngine;
    } else if (engine === 'anime') {
      if (!this.AnimeEngine) throw new E500('Search not ready');
      SearchEngine = this.AnimeEngine;
    } else throw new E500(`[SearchService]: Can not search not exist engine - ${engine}`);

    const results = SearchEngine.search(query, {
      limit
    }).map(el => el.item);

    return results;
  }
}



const Search = new SearchService();
export default Search;