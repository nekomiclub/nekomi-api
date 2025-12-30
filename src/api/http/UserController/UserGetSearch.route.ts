import DTOService from '~/service/DataTransferService';
import IUser from '~/intf/IUser';
import conf from '~/config';
import { HandleRequest } from '~/utils/http-utils';
import { Middleware } from '~/service/MiddlewareService';
import { RequestSearch, UserSearch } from '~/service/SearchService';
import { UserRepositoryClass } from '~/repo/UserRepository';



/**
 * Search users
 */
const endpoint = HandleRequest(async (req, res) => {
  const repo = new UserRepositoryClass();
  const { results, pagination } = await RequestSearch<IUser>(req, repo, UserSearch, DTOService.user);

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