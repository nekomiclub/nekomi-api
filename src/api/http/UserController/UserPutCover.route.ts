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
  path: '/user/{id}/cover',
  summary: 'Update user with id cover. FormData with file=File must be sent',
  tags: ['User Router'],
  request: {
    params: RequestParamsSchema
  },
  responses: {
    200: {
      description: 'Cover updated',
      content: {
        'application/json': {
          schema: ResponseSchema
        }
      }
    }
  }
});



/**
 * Upload user cover
 */
const endpoint = HandleRequest(async (req, res) => {
  const repo = new UserRepositoryClass();
  const url = await HandleUserControllerACUpload(req, repo, 'uploadCover');



  return res.status(200).json(SendResponse({
    ok: true,
    message: 'Cover updated!',
    data: {
      url
    }
  }, ResponseSchema));
}, { middlewares: ['checkAccess', 'checkAPIKey'] });



export default EndpointMiddlewares([
  ...UserControllerACUploadMiddlewares
], endpoint);



export const UserPutCoverRequestSchemas = {
  RequestParamsSchema,
  ResponseSchema,
};