import SessionService from '~/service/SessionService';
import conf from '~/config';
import z from 'zod';
import { HandleRequest, removeSessionCookie } from '~/utils/http-utils';
import { Middleware } from '~/service/MiddlewareService';
import { ROLE_PERMISSION } from '~/intf/IRole';
import { getSessionAuth } from '~/utils/auth-utils';



interface IResponse {
  message: string
}



const ParamSchema = z.object({
  sessionId: z.string().nonempty().optional()
});



/**
 * Logout session
 */
const endpoint = HandleRequest(async (req, res) => {
  try {
    const { userId, sessionId } = await getSessionAuth(req, res);
    const params = ParamSchema.parse(req.params);

    const session = new SessionService();
    await session.init({ id: userId });

    const targetSessionId = params.sessionId ?? sessionId;



    if (sessionId === targetSessionId) {
      // Logout current session
      await session.logout(targetSessionId, sessionId);
      await session.save();

      removeSessionCookie(res);

      return res.status(200).json({
        message: 'Session logged out'
      } satisfies IResponse);
    } else {
      // Logout other session
      await session.logout(targetSessionId, sessionId);
      await session.save();

      return res.status(200).json({
        message: `Session "${targetSessionId}" logged out`
      } satisfies IResponse);
    }
  } catch (e) {
    removeSessionCookie(res);

    throw e;
  }
});



const AuthGetLogoutRoute = [
  Middleware.CheckCSRF([conf.domains.NEKOMI_DOMAIN]),
  Middleware.CheckAccess([ROLE_PERMISSION.BASIC]),
  endpoint
];

export default AuthGetLogoutRoute;