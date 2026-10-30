import HandleUserControllerACUpload, { UserControllerACUploadMiddlewares } from './_utils';
import z from 'zod';
import { CreateResponseSchema, EndpointMiddlewares, HandleRequest, SendResponse } from '~/utils/http-utils';
import { UserRepositoryClass } from '~/repo/UserRepository';
import { registry } from '~/service/openapi/registry';



const RequestParamsSchema = z.object({
  id: z.string().nonempty().optional()
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
    params: RequestParamsSchema
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
}, { middlewares: ['checkAccess', 'checkCSRF'] });



export default EndpointMiddlewares([
  ...UserControllerACUploadMiddlewares
], endpoint);



export const UserPutAvatarRouteSchemas = {
  RequestParamsSchema,
  ResponseSchema,
};