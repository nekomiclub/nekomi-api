import DTOService from '~/service/DataTransferService';
import IDubber from '~/intf/IDubber';
import conf from '~/config';
import { DubberRepositoryClass } from '~/repo/DubberRepository';
import { DubberSearch, RequestSearch } from '~/service/SearchService';
import { HandleRequest } from '~/utils/http-utils';
import { Middleware } from '~/service/MiddlewareService';



/**
 * Search dubbers
 */
const endpoint = HandleRequest(async (req, res) => {
  const repo = new DubberRepositoryClass();
  const { results, pagination } = await RequestSearch<IDubber>(req, repo, DubberSearch, DTOService.dubber);

  return res.status(200).json({
    message: 'Dubbers searched',
    results,
    pagination
  });
});



const DubberGetSearchRoute = [
  Middleware.CheckCSRF([conf.domains.NEKOMI_DOMAIN]),
  endpoint
];

export default DubberGetSearchRoute;