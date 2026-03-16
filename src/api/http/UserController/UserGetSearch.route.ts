import IUser from '~/schemas/entities/User.schema';
import conf from '~/conf';
import { HandleRequest } from '~/utils/http-utils';
import { IPagination } from '~/utils/pagination';
import { Middleware } from '~/service/MiddlewareService';
import { RequestSearch, UserSearch } from '~/service/SearchService';
import { UserRepositoryClass } from '~/repo/UserRepository';



type UserSearchResultType = Pick<IUser, 'id' | 'username' | 'avatar'>



interface IRespone {
  message: string
  results: UserSearchResultType[]
  pagination?: IPagination
}



/**
 * Search users
 */
const endpoint = HandleRequest(async (req, res) => {
  const repo = new UserRepositoryClass();
  const { results: raw, pagination } = await RequestSearch<IUser>(req, repo, UserSearch);

  const results: UserSearchResultType[] = raw.map(result => {
    const { id, username, avatar } = result;

    return {
      id,
      username,
      avatar
    } satisfies UserSearchResultType;
  });



  return res.status(200).json({
    message: 'Users searched',
    results,
    pagination
  } satisfies IRespone);
});



const UserGetSearchRoute = [
  Middleware.CheckCSRF([conf.domains.NEKOMI_DOMAIN]),
  endpoint
];

export default UserGetSearchRoute;