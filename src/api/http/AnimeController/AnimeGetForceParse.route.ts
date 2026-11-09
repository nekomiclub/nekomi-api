import AnimeUpdateCrawler from '~/algorithms/AnimeUpdateCrawler.js';
import z from 'zod';
import { CreateResponseSchema, EndpointMiddlewares, HandleRequest, SendResponse } from '~/utils/http-utils.js';
import { Middleware } from '~/services/MiddlewareService.js';
import { ROLE_PERMISSION_ENUM } from '~/domain/role.schema.js';

import AnimePlayerUpdateCrawler from '~/algorithms/AnimePlayerUpdateCrawler.js';
import { asAnimeId } from '~/interfaces/BrandedIds.js';
import { registry } from '~/services/openapi/registry.js';



const RequestParamsSchema = z.object({
  qr: z.string().nonempty()
});

const ResponseSchema = CreateResponseSchema(z.null());



registry.registerPath({
  method: 'get',
  path: '/anime/{qr}/parse',
  summary: 'Force re-parse anime from 3-rd parties',
  tags: ['Anime Router'],
  request: {
    params: RequestParamsSchema,
  },
  responses: {
    200: {
      description: 'Anime has been re-parsed',
      content: {
        'application/json': {
          schema: ResponseSchema
        }
      }
    }
  }
});



/**
 * Get anime force parse 
 */
const endpoint = HandleRequest(async (req, res) => {
  const { qr: query } = RequestParamsSchema.parse(req.params);

  await AnimeUpdateCrawler.syncAnimeDocument(asAnimeId(query));

  await AnimePlayerUpdateCrawler.updateTeamsMap();
  await AnimePlayerUpdateCrawler.syncAnimePlayer(asAnimeId(query));



  return res.status(200).json(SendResponse({
    ok: true,
    message: 'Anime successfully re-parsed',
    data: null
  }, ResponseSchema));
});



export default EndpointMiddlewares([
  Middleware.CheckAPIKey(),
  Middleware.CheckAccess([ROLE_PERMISSION_ENUM.ABSOLUTE]),
], endpoint);



export const AnimeGetForceParseRouteSchemas = {
  RequestParamsSchema,
  ResponseSchema,
};