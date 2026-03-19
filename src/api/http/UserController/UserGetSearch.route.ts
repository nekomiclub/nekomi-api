import DTS from '~/service/DataTransferService';
import IUser, { IUserMinified, UserMinifiedSchema } from '~/schemas/entities/User.schema';
import conf from '~/conf';
import z from 'zod';
import { HandleRequest } from '~/utils/http-utils';
import { Middleware } from '~/service/MiddlewareService';
import { PaginationSchema } from '~/utils/pagination';
import { RequestSearch, UserSearch } from '~/service/SearchService';
import { UserRepositoryClass } from '~/repo/UserRepository';



const ResponseSchema = z.object({
  message: z.string(),
  results: UserMinifiedSchema.array(),
  pagination: PaginationSchema.optional(),
});



/**
 * Search users
 */
const endpoint = HandleRequest(async (req, res) => {
  const repo = new UserRepositoryClass();
  const { results: searches, pagination } = await RequestSearch<IUser>(req, repo, UserSearch);

  const results: IUserMinified[] = searches.map(result => DTS.toUserMinified(result));



  return res.status(200).json({
    message: 'Users searched',
    results,
    pagination
  } satisfies z.infer<typeof ResponseSchema>);
});



const UserGetSearchRoute = [
  Middleware.CheckCSRF([conf.domains.NEKOMI_DOMAIN]),
  endpoint
];

export default UserGetSearchRoute;