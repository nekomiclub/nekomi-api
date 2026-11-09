import z from 'zod';

import conf from '~/conf.js';
import { registry } from '~/services/openapi/registry.js';
import env from '~/utils/env.js';
import { CreateResponseSchema, EndpointMiddlewares, HandleRequest, SendResponse } from '~/utils/http-utils.js';



export const GetPingResponseSchema = CreateResponseSchema(z.object({
  started_at: z.string().describe('ISO started at timestamp'),
  commit_hash: z.string().describe('Current build commit hash'),
  version: z.string().describe('Current build version'),
  environment: z.string().describe('Runtime environment'),
}));



registry.registerPath({
  method: 'get',
  path: '/healthcheck',
  summary: 'Check API health',
  tags: ['Generic Router'],
  request: {},
  responses: {
    200: {
      description: 'API is healthy!',
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
    message: 'API is healthy!',
    data: {
      started_at: conf.started_at,
      commit_hash: env('GIT_SHA')?.slice(0, 7) ?? 'unknown',
      version: env('APP_VERSION') ? `v${env('APP_VERSION')}` : 'v0.0.0',
      environment: conf.started_mode.toLowerCase(),
    }
  }, GetPingResponseSchema));
});



export default EndpointMiddlewares([], endpoint);