import SessionService from '~/service/SessionService';
import conf from '~/conf';
import z from 'zod';
import { ErrorConstructor } from '~/service/ExceptionService';
import { HandleRequest } from '~/utils/http-utils';
import { Middleware } from '~/service/MiddlewareService';
import { getSessionAuth } from '~/utils/auth-utils';



export const GetLogoutParamSchema = z.object({
  sessionId: z.string().nonempty().optional()
});

export const GetLogoutResponseSchema = z.object({
  message: z.string()
});



/**
 * Logout session
 */
const endpoint = HandleRequest(async (req, res) => {
  try {
    const { userId, sessionId } = await getSessionAuth(req, res);
    const params = GetLogoutParamSchema.parse(req.params);

    const session = new SessionService();
    await session.init({ id: userId });

    const targetSessionId = params.sessionId ?? sessionId;



    await session.logout(targetSessionId, sessionId);
    await session.save();

    if (sessionId === targetSessionId) {
      // Logout current session
      res.clearCookie(conf.vars.SESSION_COOKIE_NAME);

      return res.status(200).json({
        message: 'Session logged out'
      } satisfies z.infer<typeof GetLogoutResponseSchema>);
    } else {
      // Logout specified session
      return res.status(200).json({
        message: `Session "${targetSessionId}" logged out`
      } satisfies z.infer<typeof GetLogoutResponseSchema>);
    }
  } catch (e) {
    res.clearCookie(conf.vars.SESSION_COOKIE_NAME);

    if (e instanceof ErrorConstructor && (e.status && e.status < 500)) return res.status(200).json({ message: 'Session logged out' });

    throw e;
  }
}, { middlewares: ['checkCSRF'] });



export default [
  Middleware.CheckCSRF([conf.domains.NEKOMI_DOMAIN]),
  endpoint
];