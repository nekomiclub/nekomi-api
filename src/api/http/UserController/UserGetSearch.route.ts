import DTS from '~/services/DataTransferService.js';
import IUser, { IUserSearchResult, UserSearchResultSchema } from '~/schemas/entities/User.schema.js';
import z from 'zod';
import { CreateResponseSchema, EndpointMiddlewares, HandleRequest, SendResponse } from '~/utils/http-utils.js';
import { Middleware } from '~/services/MiddlewareService.js';
import { PaginationSchema } from '~/utils/pagination.js';
import { RequestSearch, SearchServiceQueryParamsSchema, UserSearch } from '~/services/SearchService.js';
import { UserRepositoryClass } from '~/repositories/UserRepository.js';
import { registry } from '~/services/openapi/registry.js';



const RequestQuerySchema = SearchServiceQueryParamsSchema;

const ResponseSchema = CreateResponseSchema(z.object({
  results: UserSearchResultSchema.array(),
  pagination: PaginationSchema.optional(),
}));



registry.registerPath({
  method: 'get',
  path: '/user/search',
  summary: 'Search users',
  tags: ['User Router'],
  request: {
    query: RequestQuerySchema,
  },
  responses: {
    200: {
      description: 'Users searched',
      content: {
        'application/json': {
          schema: ResponseSchema
        }
      }
    }
  }
});



/**
 * Search users
 */
const endpoint = HandleRequest(async (req, res) => {
  const repo = new UserRepositoryClass();
  const { results: searches, pagination } = await RequestSearch<IUser>(req, repo, UserSearch);

  const results: IUserSearchResult[] = searches.map(result => DTS.toUserMinified(result));



  return res.status(200).json(SendResponse({
    ok: true,
    message: 'Users searched',
    data: {
      results,
      pagination
    }
  }, ResponseSchema));
});



export default EndpointMiddlewares([
  Middleware.CheckAPIKey(),
], endpoint);



export const UserGetSearchRouteSchemas = {
  ResponseSchema
};