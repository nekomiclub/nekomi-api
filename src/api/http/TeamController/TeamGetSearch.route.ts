import DTS from '~/services/DataTransferService.js';
import ITeam, { TeamSearchResultSchema } from '~/domain/team.schema.js';
import z from 'zod';
import { CreateResponseSchema, EndpointMiddlewares, HandleRequest, SendResponse } from '~/utils/http-utils.js';
import { Middleware } from '~/services/MiddlewareService.js';
import { PaginationSchema } from '~/utils/pagination.js';
import { RequestSearch, SearchServiceQueryParamsSchema, TeamSearch } from '~/services/SearchService.js';
import { TeamRepositoryClass } from '~/repositories/TeamRepository.js';
import { registry } from '~/services/openapi/registry.js';



const RequestQuerySchema = SearchServiceQueryParamsSchema;

const ResponseSchema = CreateResponseSchema(z.object({
  results: TeamSearchResultSchema.array(),
  pagination: PaginationSchema.optional()
}));



registry.registerPath({
  method: 'get',
  path: '/team/search',
  summary: 'Search teams',
  tags: ['Team Router'],
  request: {
    query: RequestQuerySchema
  },
  responses: {
    200: {
      description: 'Teams searched',
      content: {
        'application/json': {
          schema: ResponseSchema
        }
      }
    }
  }
});



/**
 * Search dubbers
 */
const endpoint = HandleRequest(async (req, res) => {
  const { results: searches, pagination } = await RequestSearch<ITeam>(req, new TeamRepositoryClass(), TeamSearch);

  const results = searches.map(result => DTS.toTeamSearchResult(result));



  return res.status(200).json(SendResponse({
    ok: true,
    message: 'Dubbers searched',
    data: {
      results,
      pagination
    }
  }, ResponseSchema));
});



export default EndpointMiddlewares([
  Middleware.CheckAPIKey(),
], endpoint);



export const TeamGetSearchRouteSchemas = {
  RequestQuerySchema,
  ResponseSchema,
};