import HandleTeamControllerACUpload, { TeamControllerACUploadMiddlewares } from './_utils';
import z from 'zod';
import { CreateResponseSchema, EndpointMiddlewares, HandleRequest, SendResponse } from '~/utils/http-utils';
import { TeamRepositoryClass } from '~/repo/TeamRepository';
import { registry } from '~/service/openapi/registry';



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
}, { middlewares: ['checkAccess', 'checkCSRF'] });



export default EndpointMiddlewares([
  ...TeamControllerACUploadMiddlewares,
], endpoint);



export const TeamPutCoverRouteSchemas = {
  RequestParamsSchema,
  ResponseSchemas,
};