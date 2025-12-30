import DTOService from '~/service/DataTransferService';
import IAnime from '~/intf/IAnime';
import conf from '~/config';
import { AnimeRepositoryClass } from '~/repo/AnimeRepository';
import { AnimeSearch, RequestSearch } from '~/service/SearchService';
import { HandleRequest } from '~/utils/http-utils';
import { Middleware } from '~/service/MiddlewareService';



/**
 * Search anime documents
 */
const endpoint = HandleRequest(async (req, res) => {
  const repo = new AnimeRepositoryClass();
  const { results, pagination } = await RequestSearch<IAnime>(req, repo, AnimeSearch, DTOService.anime);

  return res.status(200).json({
    message: 'Animes searched',
    results,
    pagination
  });
});



const AnimeGetSearchRoute = [
  Middleware.CheckCSRF([conf.domains.NEKOMI_DOMAIN]),
  endpoint
];

export default AnimeGetSearchRoute;