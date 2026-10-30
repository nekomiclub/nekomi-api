import DTS from '~/service/DataTransferService';
import ITeam, { TeamMinifiedSchema } from '~/schemas/entities/Team.schema';
import conf from '~/conf';
import z from 'zod';
import { CreateResponseSchema, EndpointMiddlewares, HandleRequest, SendResponse } from '~/utils/http-utils';
import { Middleware } from '~/service/MiddlewareService';
import { PaginationSchema } from '~/utils/pagination';
import { RequestSearch, SearchServiceQueryParamsSchema, TeamSearch } from '~/service/SearchService';
import { TeamRepositoryClass } from '~/repo/TeamRepository';
import { registry } from '~/service/openapi/registry';



export const TeamSearchResultSchema = TeamMinifiedSchema.extend({
  short_about: z.string().optional()
});



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

  const results = searches.map(result => {
    return {
      ...DTS.toTeamMinified(result),
      short_about: result.about?.slice(0, 200)
    } satisfies z.infer<typeof TeamSearchResultSchema>;
  });



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
  Middleware.CheckCSRF([conf.domains.NEKOMI_DOMAIN]),
], endpoint);



export const TeamGetSearchRouteSchemas = {
  RequestQuerySchema,
  ResponseSchema,
};