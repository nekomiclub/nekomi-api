import Logger from '~/service/LoggerService';
import SessionService from '~/service/SessionService';
import UserRepository, { UserRepositoryClass } from '~/repo/UserRepository';
import firebase from 'firebase-admin';
import z from 'zod';
import { AUTH_METHOD } from '~/intf/IAuth';
import { DevelopmentMode } from '~/config';
import { ErrorConstructor, NekoError } from '~/service/ExceptionService';
import { HTTPEndpoint, setSessionCookie } from '~/service/HTTPService';
import { IUserSession, USER_RESTRICTION } from '~/intf/IUser';



interface IResponse {
  message: string
  user: {
    id: string
    username: string
    avatar: string
    cover: string
  }
  session: IUserSession
}



const BodyParser = z.object({
  method: z.nativeEnum(AUTH_METHOD),

  /**
   * Authorization token
   * 
   * @requires AUTH_METHOD.GOOGLE
   */
  token: z.string().optional()
});



/**
 * Authorize user
 */
const endpoint = HTTPEndpoint(async (req, res) => {
  const { method, token } = BodyParser.parse(req.body);



  let email: string;
  let isUserNew = false;



  // Retrieve user email
  if (method === AUTH_METHOD.GOOGLE) {
    if (!token) throw new NekoError('auth:token_invalid');

    try {
      const data = await firebase.auth().verifyIdToken(token);
      if (!data.email) throw new NekoError(`auth:failed`, `Authorization failed: email is not exist in provider response`);

      email = data.email;
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

    await repo.setUsername(email.split('@')[0], { provided: true });
    await repo.setEmail(email);

    await repo.save();

    user = repo.document!;
  }

  // Prevent banned users from authorizing
  if (user.restrictions.includes(USER_RESTRICTION.BANNED)) throw new NekoError('user:banned');

  const session = new SessionService();
  await session.init({ email });

  const { token: sessionToken, session: sessionData } = await session.open({ is_limited: !isUserNew });

  await session.save();



  setSessionCookie(sessionToken, res);

  return res.status(200).json({
    message: 'User authorized',
    user: {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      cover: user.cover,
    },
    session: sessionData
  } as IResponse);
});



const AuthPostRoute = [
  endpoint
];

export default AuthPostRoute;