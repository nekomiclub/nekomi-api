import HandleUserControllerACUpload, { UserControllerACUploadMiddlewares } from './_utils.js';
import z from 'zod';
import { CreateResponseSchema, EndpointMiddlewares, HandleRequest, SendResponse } from '~/utils/http-utils.js';
import { UserRepositoryClass } from '~/repositories/UserRepository.js';
import { registry } from '~/services/openapi/registry.js';



const RequestParamsSchema = z.object({
  id: z.string().nonempty()
});

const ResponseSchema = CreateResponseSchema(z.object({
  url: z.string().url()
}));



registry.registerPath({
  method: 'put',
  path: '/user/{id}/avatar',
  summary: 'Update user with id avatar. FormData with file=File must be sent',
  tags: ['User Router'],
  request: {
    params: RequestParamsSchema.required()
  },
  responses: {
    200: {
      description: 'Avatar updated',
      content: {
        'application/json': {
          schema: ResponseSchema
        }
      }
    }
  }
});



/**
 * Upload user avatar
 */
const endpoint = HandleRequest(async (req, res) => {
  const repo = new UserRepositoryClass();
  const url = await HandleUserControllerACUpload(req, repo, 'uploadAvatar');



  return res.status(200).json(SendResponse({
    ok: true,
    message: 'Avatar updated!',
    data: {
      url
    }
  }, ResponseSchema));
}, { middlewares: ['checkAccess', 'checkAPIKey'] });



export default EndpointMiddlewares([
  ...UserControllerACUploadMiddlewares
], endpoint);



export const UserPutAvatarRouteSchemas = {
  RequestParamsSchema,
  ResponseSchema,
};