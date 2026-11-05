import FeedRepository from 'src/repositories/FeedRepository.js';
import z from 'zod';
import { CreateResponseSchema, EndpointMiddlewares, HandleRequest, SendResponse } from '~/utils/http-utils.js';
import { Middleware } from 'src/services/MiddlewareService.js';
import { ROLE_PERMISSION_ENUM } from 'src/schemas/entities/Role.schema.js';
import { registry } from '~/service/openapi/registry.js';



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

  await FeedRepository.create(body);



  return res.status(200).json(SendResponse({
    ok: true,
    message: 'New feed record has been created!',
    data: {}
  }, ResponseSchema));
}, { middlewares: ['checkAPIKey', 'checkAccess'] });



export default EndpointMiddlewares([
  Middleware.CheckAPIKey(),
  Middleware.CheckAccess([ROLE_PERMISSION_ENUM.ABSOLUTE]),
], endpoint);



export const PostFeedRouteSchema = {
  RequestBodySchema,
  ResponseSchema,
};