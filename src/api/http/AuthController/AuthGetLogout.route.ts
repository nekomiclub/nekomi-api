import z from 'zod';

import conf from '~/conf.js';
import { ErrorConstructor } from '~/services/ExceptionService.js';
import { Middleware } from '~/services/MiddlewareService.js';
import { registry } from '~/services/openapi/registry.js';
import SessionService from '~/services/SessionService.js';
import { getSessionAuth } from '~/utils/auth-utils.js';
import { CreateResponseSchema, EndpointMiddlewares, HandleRequest, SendResponse } from '~/utils/http-utils.js';



const RequestParamsSchema = z.object({
  sessionId: z.string().nonempty().optional()
});

const ResponseSchema = CreateResponseSchema(z.null());



registry.registerPath({
  method: 'get',
  path: '/auth/logout',
  summary: 'Logout authenticated session',
  tags: ['Auth Router'],
  responses: {
    200: {
      description: 'Logged out',
      content: {
        'application/json': {
          schema: ResponseSchema
        }
      }
    }
  }
});

registry.registerPath({
  method: 'get',
  path: '/auth/logout/{sessionId}',
  summary: 'Logout session with id',
  tags: ['Auth Router'],
  request: {
    params: RequestParamsSchema.required()
  },
  responses: {
    200: {
      description: 'Logged out',
      content: {
        'application/json': {
          schema: ResponseSchema
        }
      }
    }
  }
});



/**
 * Logout session
 */
const endpoint = HandleRequest(async (req, res) => {
  try {
    const { userId, sessionId } = await getSessionAuth(req, res);
    const params = RequestParamsSchema.parse(req.params);

    const session = new SessionService();
    await session.init({ id: userId });

    const targetSessionId = params.sessionId ?? sessionId;



    await session.logout(targetSessionId, sessionId);
    await session.save();

    if (sessionId === targetSessionId) {
      // Logout current session
      res.clearCookie(conf.variables.SESSION_COOKIE_NAME);

      return res.status(200).json(SendResponse({
        ok: true,
        message: 'Session logged out',
        data: null
      }, ResponseSchema));
    } else {
      // Logout specified session
      return res.status(200).json(SendResponse({
        ok: true,
        message: `Session "${targetSessionId}" logged out`,
        data: null
      }, ResponseSchema));
    }
  } catch (e) {
    res.clearCookie(conf.variables.SESSION_COOKIE_NAME);

    if (e instanceof ErrorConstructor && (e.status && e.status < 500)) return res.status(200).json(SendResponse({
      ok: true,
      message: 'Session logged out',
      data: null
    }, ResponseSchema));

    throw e;
  }
}, { middlewares: ['checkAPIKey'] });



export default EndpointMiddlewares([
  Middleware.CheckAPIKey(),
], endpoint);



export const AuthGetLogoutRouteSchemas = {
  RequestParamsSchema,
  ResponseSchema,
};