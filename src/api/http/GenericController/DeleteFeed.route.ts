import z from 'zod';
import { CreateResponseSchema, EndpointMiddlewares, HandleRequest, SendResponse } from '~/utils/http-utils.js';
import { FeedRepositoryClass } from '~/repositories/FeedRepository.js';
import { Middleware } from '~/services/MiddlewareService.js';
import { ROLE_PERMISSION_ENUM } from '~/domain/role.schema.js';
import { registry } from '~/services/openapi/registry.js';



const RequestParamsSchema = z.object({
  anime_id: z.string().nonempty()
});

const ResponseSchema = CreateResponseSchema(z.object({}));



registry.registerPath({
  method: 'delete',
  path: '/feed/{anime_id}',
  summary: 'Delete feed record',
  tags: ['Generic Router'],
  request: {
    params: RequestParamsSchema
  },
  responses: {
    200: {
      description: 'Feed record has been deleted',
      content: {
        'application/json': {
          schema: ResponseSchema
        }
      }
    }
  }
});



const endpoint = HandleRequest(async (req, res) => {
  const params = RequestParamsSchema.parse(req.params);

  const repo = new FeedRepositoryClass();

  await repo.init(params.anime_id);
  await repo.deleteOne();



  return res.status(200).json(SendResponse({
    ok: true,
    message: 'Feed record has been deleted',
    data: {}
  }, ResponseSchema));
}, { middlewares: ['checkAPIKey', 'checkAccess'] });



export default EndpointMiddlewares([
  Middleware.CheckAPIKey(),
  Middleware.CheckAccess([ROLE_PERMISSION_ENUM.ABSOLUTE]),
], endpoint);



export const PostFeedRouteSchema = {
  RequestParamsSchema,
  ResponseSchema,
};