import AnimeRepository from '~/repo/AnimeRepository.js';
import DTS from '~/service/DataTransferService.js';
import z from 'zod';
import { AnimeMinifiedSchema, IAnimeMinified } from '~/schemas/entities/Anime.schema.js';
import { CreateResponseSchema, EndpointMiddlewares, HandleRequest, SendResponse } from '~/utils/http-utils.js';
import { Middleware } from '~/service/MiddlewareService.js';
import { NekoError } from '~/service/ExceptionService.js';
import { UserLibSchema, UserMinifiedSchema } from '~/schemas/entities/User.schema.js';
import { UserRepositoryClass } from '~/repo/UserRepository.js';
import { isRequesterAccountOwner, isRequesterAdmin } from '~/utils/auth-utils.js';
import { registry } from '~/service/openapi/registry.js';



const RequestParamsSchema = z.object({
  qr: z.string().nonempty(),
  libId: z.string().nonempty(),
});

const ResponseSchema = CreateResponseSchema(z.object({
  user: UserMinifiedSchema,
  libs: UserLibSchema.array(),
  catalog: AnimeMinifiedSchema.array(),
  pagination: RequestParamsSchema.optional(),
  is_owner: z.boolean(),
}));



registry.registerPath({
  method: 'get',
  path: '/user/{qr}/lib/{libId}',
  summary: 'Get user by query lib by id',
  tags: ['User Router'],
  request: {
    params: RequestParamsSchema
  },
  responses: {
    200: {
      description: 'User lib retrieved',
      content: {
        'application/json': {
          schema: ResponseSchema
        }
      }
    }
  }
});



/**
 * Get user lib
 */
const endpoint = HandleRequest(async (req, res) => {
  const { libId, qr: query } = RequestParamsSchema.parse(req.params);

  const repo = new UserRepositoryClass();
  await repo.init(query);

  const lib = repo.document?.libs.find(el => el.id === libId);
  if (!lib) throw new NekoError(`sys:not_found`, `User lib "${libId}" is not found`);

  const is_owner = await isRequesterAccountOwner(req, repo.document.id);

  // Ensure that only owner or admin can retrieve private lib
  if (!lib.is_public) {
    if (!await isRequesterAdmin(req) && !is_owner) throw new NekoError('sys:action_prevented', `You are not eligible for retrieve user private lib`);
  }

  const documents = await AnimeRepository.getMany({ id: { $in: lib.anime_ids } });
  const catalog: IAnimeMinified[] = documents.map(el => DTS.toAnimeMinified(el));

  const libs = await DTS.parseUserLibs(req, repo.document);
  const user = DTS.toUserMinified(repo.document);



  return res.status(200).json(SendResponse({
    ok: true,
    message: 'User lib retrieved',
    data: {
      libs,
      user,
      catalog,
      is_owner
    }
  }, ResponseSchema));
});



export default EndpointMiddlewares([
  Middleware.CheckAPIKey(),
], endpoint);



export const UserGetLibRouteSchemas = {
  RequestParamsSchema,
  ResponseSchema,
};