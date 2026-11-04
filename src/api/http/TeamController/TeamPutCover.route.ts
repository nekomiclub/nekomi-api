import HandleTeamControllerACUpload, { TeamControllerACUploadMiddlewares } from './_utils.js';
import z from 'zod';
import { CreateResponseSchema, EndpointMiddlewares, HandleRequest, SendResponse } from '~/utils/http-utils.js';
import { TeamRepositoryClass } from '~/repo/TeamRepository.js';
import { registry } from '~/service/openapi/registry.js';



const RequestParamsSchema = z.object({
  id: z.string().nonempty()
});

const ResponseSchemas = CreateResponseSchema(z.object({
  url: z.string()
}));



registry.registerPath({
  method: 'put',
  path: '/team/{id}/cover',
  summary: 'Update team with id cover. FormData with file=File must be sent',
  tags: ['Team Router'],
  request: {
    params: RequestParamsSchema
  },
  responses: {
    200: {
      description: 'Cover updated',
      content: {
        'application/json': {
          schema: ResponseSchemas
        }
      }
    }
  }
});



/**
 * Upload team cover
 */
const endpoint = HandleRequest(async (req, res) => {
  const url = await HandleTeamControllerACUpload(req, new TeamRepositoryClass(), 'uploadCover');

  return res.status(200).json(SendResponse({
    ok: true,
    message: 'Cover updated!',
    data: {
      url
    }
  }, ResponseSchemas));
}, { middlewares: ['checkAccess', 'checkAPIKey'] });



export default EndpointMiddlewares([
  ...TeamControllerACUploadMiddlewares,
], endpoint);



export const TeamPutCoverRouteSchemas = {
  RequestParamsSchema,
  ResponseSchemas,
};