import DTS from '~/service/DataTransferService';
import IUser, { IUserMinified, UserMinifiedSchema } from '~/schemas/entities/User.schema';
import conf from '~/conf';
import z from 'zod';
import { CreateResponseSchema, EndpointMiddlewares, HandleRequest, SendResponse } from '~/utils/http-utils';
import { Middleware } from '~/service/MiddlewareService';
import { PaginationSchema } from '~/utils/pagination';
import { RequestSearch, SearchServiceQueryParamsSchema, UserSearch } from '~/service/SearchService';
import { UserRepositoryClass } from '~/repo/UserRepository';
import { registry } from '~/service/openapi/registry';



const RequestQuerySchema = SearchServiceQueryParamsSchema;

const ResponseSchema = CreateResponseSchema(z.object({
  results: UserMinifiedSchema.array(),
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

  const results: IUserMinified[] = searches.map(result => DTS.toUserMinified(result));



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
  Middleware.CheckCSRF([conf.domains.NEKOMI_DOMAIN]),
], endpoint);



export const UserGetSearchRouteSchemas = {
  ResponseSchema
};