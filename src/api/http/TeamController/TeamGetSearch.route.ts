import ITeam from '~/intf/ITeam';
import conf from '~/conf';
import { HandleRequest } from '~/utils/http-utils';
import { IPagination } from '~/utils/pagination';
import { Middleware } from '~/service/MiddlewareService';
import { RequestSearch, TeamSearch } from '~/service/SearchService';
import { TeamRepositoryClass } from '~/repo/TeamRepository';



type DubberSearchResultType = Pick<ITeam, 'id' | 'slug' | 'name' | 'about' | 'avatar'>



interface IRespone {
  message: string
  results: DubberSearchResultType[]
  pagination?: IPagination
}



/**
 * Search dubbers
 */
const endpoint = HandleRequest(async (req, res) => {
  const repo = new TeamRepositoryClass();
  const { results: raw, pagination } = await RequestSearch<ITeam>(req, repo, TeamSearch);

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