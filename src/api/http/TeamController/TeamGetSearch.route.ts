import z from 'zod';

import TeamEntity, { TeamSearchResultSchema } from '~/domain/team.schema.js';
import { TeamRepositoryClass } from '~/repositories/TeamRepository.js';
import DTS from '~/services/DataTransferService.js';
import { Middleware } from '~/services/MiddlewareService.js';
import { registry } from '~/services/openapi/registry.js';
import { RequestSearch, SearchServiceQueryParamsSchema, TeamSearch } from '~/services/SearchService.js';
import { CreateResponseSchema, EndpointMiddlewares, HandleRequest, SendResponse } from '~/utils/http-utils.js';
import { PaginationSchema } from '~/utils/pagination.js';



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
  const { results: searches, pagination } = await RequestSearch<TeamEntity>(req, new TeamRepositoryClass(), TeamSearch);

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