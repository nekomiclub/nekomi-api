import IAnime, { AnimeType, AnimeTypes } from '~/intf/IAnime';
import conf from '~/conf';
import { AnimeRepositoryClass } from '~/repo/AnimeRepository';
import { AnimeSearch, RequestSearch } from '~/service/SearchService';
import { CDNString } from '~/intf/types';
import { HandleRequest } from '~/utils/http-utils';
import { IPagination } from '~/utils/pagination';
import { Middleware } from '~/service/MiddlewareService';



type AnimeSearchResultType = Pick<IAnime, 'id' | 'slug' | 'title_ua' | 'title_en' | 'score' | 'episodes_released' | 'episodes_total' | 'year'> & {
  poster: CDNString
  type: AnimeType | null
}



interface IRespone {
  message: string
  results: AnimeSearchResultType[]
  pagination?: IPagination
}



/**
 * Search anime documents
 */
const endpoint = HandleRequest(async (req, res) => {
  const repo = new AnimeRepositoryClass();
  const { results: raw, pagination } = await RequestSearch<IAnime>(req, repo, AnimeSearch);

  const results: AnimeSearchResultType[] = raw.map(result => {
    const { id, episodes_released, episodes_total, score, slug, title_en, title_ua, type, year } = result;

    return {
      id,
      episodes_released,
      episodes_total,
      poster: result.posters.find(el => el.is_hero)?.small ?? result.posters[0]?.small ?? conf.vars.defaultPoster,
      score,
      slug,
      title_en,
      title_ua,
      type: type && AnimeTypes[type],
      year,
    } satisfies AnimeSearchResultType;
  });



  return res.status(200).json({
    message: 'Animes searched',
    results,
    pagination
  } satisfies IRespone);
});



const AnimeGetSearchRoute = [
  Middleware.CheckCSRF([conf.domains.NEKOMI_DOMAIN]),
  endpoint
];

export default AnimeGetSearchRoute;