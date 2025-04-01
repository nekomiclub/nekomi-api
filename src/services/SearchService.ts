import AnimeModel from '~/core/models/AnimeModel';
import DubberService from '~/core/services/DubberService';
import Fuse from 'fuse.js';
import UserModel from '~/core/models/UserModel';
import { Anime } from '~/core/interfaces/AnimeIntf';
import { E500, ERR_NOT_READY } from './ErrorService';
import { IDubber } from '~/core/interfaces/DubberIntf';
import { IUser } from '~/core/interfaces/UserIntf';
import { Logger } from './LoggerService';
import { MongoDocumentDTO } from '~/core/services/DTO';



interface SearchProps {
  query: string
  engine: SearchEngineType

  /** @default 10 */
  limit?: number
}

export type SearchEngineType = 'user' | 'dubber' | 'anime';



class SearchService {
  private UserEngine: Fuse<IUser> | null = null;
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
      const list = (await UserModel.find()).map(el => new MongoDocumentDTO().user({ document: el, details: true }));

      const keys: (keyof IUser)[] = [
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
      const list = (await AnimeModel.find()).map(el => new MongoDocumentDTO().anime({ document: el, details: true }));

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
      if (!this.UserEngine) throw new ERR_NOT_READY();
      SearchEngine = this.UserEngine;
    } else if (engine === 'dubber') {
      if (!this.DubberEngine) throw new ERR_NOT_READY();
      SearchEngine = this.DubberEngine;
    } else if (engine === 'anime') {
      if (!this.AnimeEngine) throw new ERR_NOT_READY();
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