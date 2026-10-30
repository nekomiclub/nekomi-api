import DTS from '~/service/DataTransferService';
import IAnime, { AnimeExtendedSchema, IAnimeExtended } from '~/schemas/entities/Anime.schema';
import conf from '~/conf';
import z from 'zod';
import { AnimeRepositoryClass } from '~/repo/AnimeRepository';
import { AnimeSearch, RequestSearch, SearchServiceQueryParamsSchema } from '~/service/SearchService';
import { CreateResponseSchema, EndpointMiddlewares, HandleRequest, SendResponse } from '~/utils/http-utils';
import { Middleware } from '~/service/MiddlewareService';
import { PaginationSchema } from '~/utils/pagination';
import { registry } from '~/service/openapi/registry';



const RequestQuerySchema = SearchServiceQueryParamsSchema;

const ResponseSchema = CreateResponseSchema(z.object({
  results: AnimeExtendedSchema.array(),
  pagination: PaginationSchema.optional()
}));



registry.registerPath({
  method: 'get',
  path: '/anime/search',
  summary: 'Search anime',
  tags: ['Anime Router'],
  request: {
    query: RequestQuerySchema
  },
  responses: {
    200: {
      description: 'Anime searched',
      content: {
        'application/json': {
          schema: ResponseSchema
        }
      }
    }
  }
});



/**
 * Search anime documents
 */
const endpoint = HandleRequest(async (req, res) => {
  const repo = new AnimeRepositoryClass();
  const { results: raw, pagination } = await RequestSearch<IAnime>(req, repo, AnimeSearch);

  const results: IAnimeExtended[] = raw.map(result => DTS.toAnimeExtended(result));



  return res.status(200).json(SendResponse({
    ok: true,
    message: 'Animes searched',
    data: {
      results,
      pagination
    }
  }, ResponseSchema));
});



export default EndpointMiddlewares([
  Middleware.CheckCSRF([conf.domains.NEKOMI_DOMAIN]),
], endpoint);



export const AnimeGetSearchRouteSchemas = {
  RequestQuerySchema,
  ResponseSchema,
};