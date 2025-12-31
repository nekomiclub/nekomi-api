import IDubber from '~/intf/IDubber';
import conf from '~/conf';
import { DubberRepositoryClass } from '~/repo/DubberRepository';
import { DubberSearch, RequestSearch } from '~/service/SearchService';
import { HandleRequest } from '~/utils/http-utils';
import { IPagination } from '~/utils/pagination';
import { Middleware } from '~/service/MiddlewareService';



type DubberSearchResultType = Pick<IDubber, 'id' | 'slug' | 'name' | 'about' | 'avatar'>



interface IRespone {
  message: string
  results: DubberSearchResultType[]
  pagination?: IPagination
}



/**
 * Search dubbers
 */
const endpoint = HandleRequest(async (req, res) => {
  const repo = new DubberRepositoryClass();
  const { results: raw, pagination } = await RequestSearch<IDubber>(req, repo, DubberSearch);

  const results: DubberSearchResultType[] = raw.map(result => {
    const { about, avatar, id, name, slug, } = result;

    return {
      about,
      avatar,
      id,
      name,
      slug,
    } satisfies DubberSearchResultType;
  });



  return res.status(200).json({
    message: 'Dubbers searched',
    results,
    pagination
  } satisfies IRespone);
});



const DubberGetSearchRoute = [
  Middleware.CheckCSRF([conf.domains.NEKOMI_DOMAIN]),
  endpoint
];

export default DubberGetSearchRoute;