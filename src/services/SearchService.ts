import AnimeRepository from '~/repo/AnimeRepository';
import DubberRepository from '~/repo/DubberRepository';
import Fuse, { FuseOptionKey } from 'fuse.js';
import UnifiedRepositoryClass from '~/repo/UnifiedRepository';
import UserRepository from '~/repo/UserRepository';
import express from 'express';
import z from 'zod';
import { IPagination } from '~/utils/pagination';



interface ISearchResponse<T> {
  results: T[]
  pagination?: IPagination
}



class SearchServiceClass<T extends object> {
  private engine: Fuse<T> | null = null;



  constructor(
    readonly repository: UnifiedRepositoryClass<T>,
    readonly searchKeys: FuseOptionKey<T>[],
  ) {
    this.update();
  }



  /**
   * Update cache
   */
  async update() {
    const documents = await this.repository.getMany();

    this.engine = new Fuse(documents, {
      keys: this.searchKeys,
      shouldSort: true,
      ignoreLocation: true
    });
  }



  /** 
   * Search item. Will return EXPOSED items
   */
  async search(query: string, limit: number): Promise<T[]> {
    // Await engine if it is not ready
    if (!this.engine) {
      await new Promise(res => {
        const int = setInterval(() => {
          if (!this.engine) return;

          res(1);
          clearInterval(int);
        }, 100);
      });
    }



    const results = this.engine?.search(query, { limit }).map(el => el.item) ?? [];

    return results;
  }
}



export const UserSearch = new SearchServiceClass(UserRepository, ['username']);
export const DubberSearch = new SearchServiceClass(DubberRepository, ['slug', 'name']);
export const AnimeSearch = new SearchServiceClass(AnimeRepository, ['title_en', 'title_ja', 'title_ua', 'title_synonims', 'slug']);



const RESULTS_DEFAULT_LIMIT = 15;
const MAX_RESULTS_LIMIT = 30;



const SearchQueryParamsSchema = z.object({
  q: z.string(),
  limit: z.number().min(1).max(MAX_RESULTS_LIMIT).default(RESULTS_DEFAULT_LIMIT),
  page: z.number().min(1).default(1)
});



export async function RequestSearch<T extends object>(req: express.Request, repository: UnifiedRepositoryClass<T>, search: SearchServiceClass<T>, dto?: (el: T) => T): Promise<ISearchResponse<T>> {
  const { q: query, limit, page } = SearchQueryParamsSchema.parse(req.query);

  let results: T[] = [];
  let pagination: IPagination | undefined;



  if (query === '~all') {
    results = (await repository.getMany()).slice(0, limit); // TODO: Implement pagination

    pagination = { limit, page };
  } else {
    results = await search.search(query, limit);
  }

  // Pass results throught dto if it is provided
  if (dto) results = results.map(el => dto(el));



  return {
    results,
    pagination
  };
}