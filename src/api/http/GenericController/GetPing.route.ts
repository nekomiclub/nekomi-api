import conf from '~/conf.js';
import z from 'zod';
import { CreateResponseSchema, EndpointMiddlewares, HandleRequest, SendResponse } from '~/utils/http-utils.js';
import { registry } from '~/service/openapi/registry.js';



export const GetPingResponseSchema = CreateResponseSchema(z.object({
  started_at: z.string()
}));



registry.registerPath({
  method: 'get',
  path: '/',
  summary: 'Ping the API',
  tags: ['Generic Router'],
  request: {},
  responses: {
    200: {
      description: 'API ping succeeded',
      content: {
        'application/json': {
          schema: GetPingResponseSchema
        }
      }
    }
  }
});



const endpoint = HandleRequest(async (req, res) => {
  return res.status(200).json(SendResponse({
    ok: true,
    message: 'pong!',
    data: {
      started_at: conf.startedAt
    }
  }, GetPingResponseSchema));
});



export default EndpointMiddlewares([], endpoint);