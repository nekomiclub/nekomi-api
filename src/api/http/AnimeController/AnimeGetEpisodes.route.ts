import z from 'zod';

import { AnimeRepositoryClass } from '~/repositories/AnimeRepository.js';
import { Middleware } from '~/services/MiddlewareService.js';
import { registry } from '~/services/openapi/registry.js';
import { CreateResponseSchema, EndpointMiddlewares, HandleRequest, SendResponse } from '~/utils/http-utils.js';

import { AnimeGetEpisodes, AnimeGetEpisodesSchema } from './_utils.js';



const RequestParamsSchema = z.object({
  qr: z.string().nonempty()
});

const ResponseSchema = CreateResponseSchema(z.object({
  anime_episodes: AnimeGetEpisodesSchema
}));



registry.registerPath({
  method: 'get',
  path: '/anime/{qr}/episodes',
  summary: 'Get anime by query episodes',
  tags: ['Anime Router'],
  request: {
    params: RequestParamsSchema,
  },
  responses: {
    200: {
      description: 'Anime episodes retrieved',
      content: {
        'application/json': {
          schema: ResponseSchema
        }
      }
    }
  }
});



/**
 * Get anime episodes with pagination
 */
const endpoint = HandleRequest(async (req, res) => {
  const { qr: query } = RequestParamsSchema.parse(req.params);

  const repo = new AnimeRepositoryClass();
  await repo.init(query);

  const anime_episodes = await AnimeGetEpisodes(repo.document);



  return res.status(200).json(SendResponse({
    ok: true,
    message: `Anime episodes retrieved`,
    data: {
      anime_episodes
    }
  }, ResponseSchema));
}, { middlewares: ['checkAPIKey'] });



export default EndpointMiddlewares([
  Middleware.CheckAPIKey(),
], endpoint);



export const AnimeGetEpisodesRouteSchemas = {
  RequestParamsSchema,
  ResponseSchema,
};