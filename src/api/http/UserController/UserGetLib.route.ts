import AnimeRepository from '~/repo/AnimeRepository';
import DTS from '~/service/DataTransferService';
import conf from '~/conf';
import z from 'zod';
import { AnimeMinifiedSchema, IAnimeMinified } from '~/schemas/entities/Anime.schema';
import { HandleRequest } from '~/utils/http-utils';
import { Middleware } from '~/service/MiddlewareService';
import { NekoError } from '~/service/ExceptionService';
import { UserLibSchema, UserMinifiedSchema } from '~/schemas/entities/User.schema';
import { UserRepositoryClass } from '~/repo/UserRepository';
import { isRequesterAccountOwner, isRequesterAdmin } from '~/utils/auth-utils';



const ParamsSchema = z.object({
  query: z.string().nonempty(),
  libId: z.string().nonempty(),
});

const ResponseSchema = z.object({
  message: z.string(),
  user: UserMinifiedSchema,
  libs: UserLibSchema.array(),
  catalog: AnimeMinifiedSchema.array(),
  pagination: ParamsSchema.optional()
});



/**
 * Get user lib
 */
const endpoint = HandleRequest(async (req, res) => {
  const { libId, query } = ParamsSchema.parse(req.params);

  const repo = new UserRepositoryClass();
  await repo.init(query);

  const lib = repo.document?.libs.find(el => el.id === libId);
  if (!lib) throw new NekoError(`sys:not_found`, `User lib "${libId}" is not found`);

  // Ensure that only owner or admin can retrieve private lib
  if (!lib.is_public) {
    if (!await isRequesterAdmin(req) && !await isRequesterAccountOwner(req, repo.document.id)) throw new NekoError('sys:action_prevented', `You are not eligible for retrieve user private lib`);
  }

  const documents = await AnimeRepository.getMany({ id: { $in: lib.anime_ids } });
  const catalog: IAnimeMinified[] = documents.map(el => DTS.toAnimeMinified(el));

  const libs = await DTS.parseUserLibs(req, repo.document);
  const user = DTS.toUserMinified(repo.document);



  return res.status(200).json({
    message: 'User lib retrieved',
    libs,
    user,
    catalog,
  } satisfies z.infer<typeof ResponseSchema>);
});



export default [
  Middleware.CheckCSRF([conf.domains.NEKOMI_DOMAIN]),
  endpoint
];