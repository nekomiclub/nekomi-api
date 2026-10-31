import AnimeUpdateCrawler from '~/algorithms/AnimeUpdateCrawler';
import conf from '~/conf';
import z from 'zod';
import { CreateResponseSchema, EndpointMiddlewares, HandleRequest, SendResponse } from '~/utils/http-utils';
import { Middleware } from '~/service/MiddlewareService';
import { ROLE_PERMISSION_ENUM } from '~/schemas/entities/Role.schema';

import AnimePlayerUpdateCrawler from '~/algorithms/AnimePlayerUpdateCrawler';
import { asAnimeId } from '~/intf/BrandedIds';
import { registry } from '~/service/openapi/registry';



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
  Middleware.CheckCSRF([conf.domains.NEKOMI_DOMAIN]),
  Middleware.CheckAccess([ROLE_PERMISSION_ENUM.ABSOLUTE]),
], endpoint);



export const AnimeGetForceParseRouteSchemas = {
  RequestParamsSchema,
  ResponseSchema,
};