import HandleTeamControllerACUpload, { TeamControllerACUploadMiddlewares } from './_utils.js';
import z from 'zod';
import { CreateResponseSchema, EndpointMiddlewares, HandleRequest, SendResponse } from '~/utils/http-utils.js';
import { TeamRepositoryClass } from '~/repo/TeamRepository.js';
import { registry } from '~/service/openapi/registry.js';



const RequestParamsSchema = z.object({
  id: z.string().nonempty()
});

const ResponseSchema = CreateResponseSchema(z.object({
  url: z.string()
}));



registry.registerPath({
  method: 'put',
  path: '/team/{id}/avatar',
  summary: 'Update team with id avatar. FormData with file=File must be sent',
  tags: ['Team Router'],
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
 * Upload dubber avatar
 */
const endpoint = HandleRequest(async (req, res) => {
  const url = await HandleTeamControllerACUpload(req, new TeamRepositoryClass(), 'uploadAvatar');

  return res.status(200).json(SendResponse({
    ok: true,
    message: 'Avatar updated!',
    data: {
      url
    }
  }, ResponseSchema));
}, { middlewares: ['checkAccess', 'checkAPIKey'] });



export default EndpointMiddlewares([
  ...TeamControllerACUploadMiddlewares
], endpoint);



export const TeamPutAvatarRouteSchemas = {
  RequestParamsSchema,
  ResponseSchema,
};