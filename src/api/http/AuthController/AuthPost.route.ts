import DTS from '~/services/DataTransferService.js';
import Logger from '~/services/LoggerService.js';
import SessionService from '~/services/SessionService.js';
import UserRepository, { UserRepositoryClass } from '~/repositories/UserRepository.js';
import firebase from 'firebase-admin';
import z from 'zod';
import { AUTH_METHOD } from '~/schemas/auth.schema.js';
import { CreateResponseSchema, EndpointMiddlewares, HandleRequest, SendResponse, setSessionCookie } from '~/utils/http-utils.js';
import { DevelopmentMode, TestMode } from '~/conf.js';
import { ErrorConstructor, NekoError } from '~/services/ExceptionService.js';
import { Middleware } from '~/services/MiddlewareService.js';
import { USER_RESTRICTION_ENUM, UserMinifiedSchema, UserSessionSchema } from '~/schemas/entities/User.schema.js';
import { registry } from '~/services/openapi/registry.js';



const RequestBodySchema = z.object({
  method: z.nativeEnum(AUTH_METHOD),
  token: z.string().optional().describe('Authorization token. @requires AUTH_METHOD.GOOGLE')
});

const ResponseSchema = CreateResponseSchema(z.object({
  user: UserMinifiedSchema,
  session: UserSessionSchema,
  token: z.string()
}));



registry.registerPath({
  method: 'post',
  path: '/auth',
  summary: 'Authorize in nekomi',
  tags: ['Auth Router'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: RequestBodySchema
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Authorized',
      content: {
        'application/json': {
          schema: ResponseSchema
        }
      }
    }
  }
});



/**
 * Authorize user
 */
const endpoint = HandleRequest(async (req, res) => {
  const { method, token } = RequestBodySchema.parse(req.body);



  let email: string;
  let isUserNew = false;



  // Retrieve user email
  if (method === AUTH_METHOD.GOOGLE) {
    if (!token) throw new NekoError('auth:token_miss');

    try {
      if (TestMode) {
        // Set email as token in test mode
        email = token;
      } else {
        const data = await firebase.auth().verifyIdToken(token);
        if (!data.email) throw new NekoError(`auth:failed`, `Authorization failed: email is not exist in provider response`);

        email = data.email;
      }
    } catch (e) {
      if (e instanceof ErrorConstructor) throw e;
      if (DevelopmentMode) Logger.error(`[Auth (${method})]: Authorization failed`, e);

      throw new NekoError(`auth:failed`);
    }
  } else {
    throw new NekoError('auth:method_invalid', `Authorization method "${method}" is invalid`);
  }



  let user = await UserRepository.safeGetOne({ email });

  // Create new user if not found
  if (!user) {
    isUserNew = true;

    const repo = new UserRepositoryClass();
    await repo.create();

    await repo.setUsername(email.split('@')[0].toLowerCase(), { provided: true });
    await repo.setEmail(email);

    await repo.save();

    user = repo.document!;
  }

  // Prevent banned users from authorizing
  if (user.restrictions.includes(USER_RESTRICTION_ENUM.BANNED)) throw new NekoError('user:banned');

  const session = new SessionService();
  await session.init({ email });

  const { token: sessionToken, session: sessionData } = await session.open({ is_limited: !isUserNew });

  await session.save();

  await setSessionCookie(sessionToken, res);

  return res.status(200).json(SendResponse({
    ok: true,
    message: 'User authorized',
    data: {
      user: DTS.toUserMinified(user),
      session: sessionData,
      token: sessionToken
    }
  }, ResponseSchema));
});



export default EndpointMiddlewares([
  Middleware.CheckAPIKey(),
], endpoint);



export const AuthPostRouteSchemas = {
  RequestBodySchema,
  ResponseSchema,
};