import z from 'zod';

import { ROLE_PERMISSION_ENUM } from '~/domain/role.schema.js';
import FeedRepository from '~/repositories/feed.repository.js';
import { Middleware } from '~/services/MiddlewareService.js';
import { registry } from '~/services/openapi/registry.js';
import { CreateResponseSchema, EndpointMiddlewares, HandleRequest, SendResponse } from '~/utils/http-utils.js';



const RequestBodySchema = z.object({
  anime_id: z.string().nonempty(),
  cover_url: z.string().url(),
  video_url: z.string().url()
});

const ResponseSchema = CreateResponseSchema(z.object({}));



registry.registerPath({
  method: 'post',
  path: '/feed',
  summary: 'Create new feed record',
  tags: ['Generic Router'],
  request: {},
  responses: {
    200: {
      description: 'New feed record has been created!',
      content: {
        'application/json': {
          schema: ResponseSchema
        }
      }
    }
  }
});



const endpoint = HandleRequest(async (req, res) => {
  const body = RequestBodySchema.parse(req.body);

  await FeedRepository.insertOne(body);



  return res.status(200).json(SendResponse({
    ok: true,
    message: 'New feed record has been created!',
    data: {}
  }, ResponseSchema));
}, { middlewares: ['checkAPIKey', 'checkAccess'] });



export default EndpointMiddlewares([
  Middleware.CheckAPIKey(),
  Middleware.CheckAccess([ROLE_PERMISSION_ENUM.enum.ABSOLUTE]),
], endpoint);



export const PostFeedRouteSchema = {
  RequestBodySchema,
  ResponseSchema,
};