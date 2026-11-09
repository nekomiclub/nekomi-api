import DTS from '~/services/DataTransferService.js';
import IAnime, { AnimeSearchResultSchema, IAnimeSearchResult } from '~/domain/anime.schema.js';
import z from 'zod';
import { AnimeRepositoryClass } from '~/repositories/AnimeRepository.js';
import { AnimeSearch, RequestSearch, SearchServiceQueryParamsSchema } from '~/services/SearchService.js';
import { CreateResponseSchema, EndpointMiddlewares, HandleRequest, SendResponse } from '~/utils/http-utils.js';
import { Middleware } from '~/services/MiddlewareService.js';
import { PaginationSchema } from '~/utils/pagination.js';
import { registry } from '~/services/openapi/registry.js';



const RequestQuerySchema = SearchServiceQueryParamsSchema;

const ResponseSchema = CreateResponseSchema(z.object({
  results: AnimeSearchResultSchema.array(),
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

  const results: IAnimeSearchResult[] = raw.map(result => DTS.toAnimeSearchResult(result));



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
  Middleware.CheckAPIKey(),
], endpoint);



export const AnimeGetSearchRouteSchemas = {
  RequestQuerySchema,
  ResponseSchema,
};