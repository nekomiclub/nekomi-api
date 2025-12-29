import AnimeRepository from '~/repo/AnimeRepository';
import DocumentDTO from '~/service/DataTransferService';
import IAnime from '~/intf/IAnime';
import conf from '~/config';
import { AnimeSearch, RequestSearch } from '~/service/SearchService';
import { HandleRequest } from '~/utils/http-utils';
import { Middleware } from '~/service/MiddlewareService';



/**
 * Search anime documents
 */
const endpoint = HandleRequest(async (req, res) => {
  const { results, pagination } = await RequestSearch<IAnime>(req, AnimeRepository, AnimeSearch, DocumentDTO.anime);



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