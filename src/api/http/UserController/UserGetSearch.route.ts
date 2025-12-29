import DocumentDTO from '~/service/DataTransferService';
import IUser from '~/intf/IUser';
import UserRepository from '~/repo/UserRepository';
import conf from '~/config';
import { HandleRequest } from '~/utils/http-utils';
import { Middleware } from '~/service/MiddlewareService';
import { RequestSearch, UserSearch } from '~/service/SearchService';



/**
 * Search users
 */
const endpoint = HandleRequest(async (req, res) => {
  const { results, pagination } = await RequestSearch<IUser>(req, UserRepository, UserSearch, DocumentDTO.user);



  return res.status(200).json({
    message: 'Users searched',
    results,
    pagination
  });
});



const UserGetSearchRoute = [
  Middleware.CheckCSRF([conf.domains.NEKOMI_DOMAIN]),
  endpoint
];

export default UserGetSearchRoute;