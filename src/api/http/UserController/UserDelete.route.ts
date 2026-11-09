import z from 'zod';

import { NekoError } from '~/services/ExceptionService.js';
import { registry } from '~/services/openapi/registry.js';
import { EndpointMiddlewares, ErrorResponseSchema, HandleRequest } from '~/utils/http-utils.js';



const RequestParamsSchema = z.object({
  /** User ID */
  id: z.string().nonempty().optional()
});



registry.registerPath({
  method: 'delete',
  path: '/user/{id}',
  summary: 'Delete user by id',
  tags: ['User Router'],
  request: {
    params: RequestParamsSchema.required()
  },
  responses: {
    501: {
      description: 'Endpoint is not implemented',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    }
  }
});



const endpoint = HandleRequest(async (req, res) => {
  throw new NekoError('sys:not_implemented');
});



export default EndpointMiddlewares([], endpoint);



export const UserDeleteRouteSchemas = {
  RequestParamsSchema
};