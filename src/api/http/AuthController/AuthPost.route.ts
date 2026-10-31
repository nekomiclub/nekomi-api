import DTS from '~/service/DataTransferService';
import Logger from '~/service/LoggerService';
import SessionService from '~/service/SessionService';
import UserRepository, { UserRepositoryClass } from '~/repo/UserRepository';
import conf, { DevelopmentMode, TestMode } from '~/conf';
import firebase from 'firebase-admin';
import z from 'zod';
import { AUTH_METHOD } from '~/schemas/auth.schema';
import { CreateResponseSchema, EndpointMiddlewares, HandleRequest, SendResponse, setSessionCookie } from '~/utils/http-utils';
import { ErrorConstructor, NekoError } from '~/service/ExceptionService';
import { Middleware } from '~/service/MiddlewareService';
import { USER_RESTRICTION_ENUM, UserMinifiedSchema, UserSessionSchema } from '~/schemas/entities/User.schema';
import { registry } from '~/service/openapi/registry';



const RequestBodySchema = z.object({
  method: z.nativeEnum(AUTH_METHOD),
  token: z.string().optional().describe('Authorization token. @requires AUTH_METHOD.GOOGLE')
});

const ResponseSchema = CreateResponseSchema(z.object({
  user: UserMinifiedSchema,
  session: UserSessionSchema,
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



  setSessionCookie(sessionToken, res);

  return res.status(200).json(SendResponse({
    ok: true,
    message: 'User authorized',
    data: {
      user: DTS.toUserMinified(user),
      session: sessionData
    }
  }, ResponseSchema));
});



export default EndpointMiddlewares([
  Middleware.CheckCSRF([conf.domains.NEKOMI_DOMAIN]),
], endpoint);



export const AuthPostRouteSchemas = {
  RequestBodySchema,
  ResponseSchema,
};