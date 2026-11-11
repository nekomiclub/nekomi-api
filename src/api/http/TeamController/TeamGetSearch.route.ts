import z from 'zod';

import { TeamSearchResultSchema } from '~/domain/team.schema.js';
import { Middleware } from '~/services/MiddlewareService.js';
import { registry } from '~/services/openapi/registry.js';
import { SearchServiceQueryParamsSchema } from '~/services/SearchService.js';
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
  summary: '[DISABLED TILL REWORK] Search teams',
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



const endpoint = HandleRequest(async (req, res) => {
  return res.status(200).json(SendResponse({
    ok: true,
    message: 'Teams searched',
    data: {
      results: [],
      pagination: {
        limit: -1,
        page: -1
      }
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