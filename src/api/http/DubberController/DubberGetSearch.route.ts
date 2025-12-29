import DocumentDTO from '~/service/DataTransferService';
import DubberRepository from '~/repo/DubberRepository';
import IDubber from '~/intf/IDubber';
import conf from '~/config';
import { DubberSearch, RequestSearch } from '~/service/SearchService';
import { HandleRequest } from '~/utils/http-utils';
import { Middleware } from '~/service/MiddlewareService';



/**
 * Search dubbers
 */
const endpoint = HandleRequest(async (req, res) => {
  const { results, pagination } = await RequestSearch<IDubber>(req, DubberRepository, DubberSearch, DocumentDTO.dubber);



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