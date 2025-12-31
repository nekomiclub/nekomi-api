import AnimeRepository from '~/repo/AnimeRepository';
import DTOService from '~/service/DataTransferService';
import conf from '~/conf';
import z from 'zod';
import { AnimeCardType } from '~/intf/IAnime';
import { HandleRequest } from '~/utils/http-utils';
import { IPagination } from '~/utils/pagination';
import { IUserLib, UserCardType } from '~/intf/IUser';
import { Middleware } from '~/service/MiddlewareService';
import { NekoError } from '~/service/ExceptionService';
import { UserRepositoryClass } from '~/repo/UserRepository';
import { isRequesterAccountOwner, isRequesterAdmin } from '~/utils/auth-utils';



interface IResponse {
  message: string
  libs: IUserLib[]
  user: UserCardType
  catalog: AnimeCardType[]
  pagination: IPagination
}

const ParamsSchema = z.object({
  userId: z.string().nonempty(),
  libId: z.string().nonempty(),
});



/**
 * Get user lib
 */
const endpoint = HandleRequest(async (req, res) => {
  const { libId, userId } = ParamsSchema.parse(req.params);

  const repo = new UserRepositoryClass();
  await repo.init(userId);

  const user = repo.document;

  const lib = repo.document?.libs.find(el => el.id === libId);
  if (!lib) throw new NekoError(`sys:not_found`, `User lib "${libId}" is not found`);

  // Ensure that only owner or admin can retrieve private lib
  if (!lib.is_public) {
    if (!await isRequesterAdmin(req) && !await isRequesterAccountOwner(req, userId)) throw new NekoError('sys:action_prevented', `You are not eligible for retrieve user private lib`);
  }

  const documents = await AnimeRepository.getMany({ id: { $in: lib.anime_ids } });
  const catalog: AnimeCardType[] = documents.map(el => DTOService.toAnimeCard(el));
  const pagination = {
    page: -1,
    limit: -1,
  };

  const userCard = DTOService.toUserCard(user);



  return res.status(200).json({
    message: 'User lib retrieved',
    libs: user.libs,
    user: userCard,
    catalog,
    pagination
  } satisfies IResponse);
});



const UserGetLibRoute = [
  Middleware.CheckCSRF([conf.domains.NEKOMI_DOMAIN]),
  endpoint
];

export default UserGetLibRoute;