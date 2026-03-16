import SessionService from '~/service/SessionService';
import conf from '~/conf';
import z from 'zod';
import { ErrorConstructor } from '~/service/ExceptionService';
import { HandleRequest, removeSessionCookie } from '~/utils/http-utils';
import { Middleware } from '~/service/MiddlewareService';
import { getSessionAuth } from '~/utils/auth-utils';



const ParamSchema = z.object({
  sessionId: z.string().nonempty().optional()
});

const ResponseSchema = z.object({
  message: z.string()
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
      } satisfies z.infer<typeof ResponseSchema>);
    } else {
      // Logout other session
      await session.logout(targetSessionId, sessionId);
      await session.save();

      return res.status(200).json({
        message: `Session "${targetSessionId}" logged out`
      } satisfies z.infer<typeof ResponseSchema>);
    }
  } catch (e) {
    removeSessionCookie(res);

    if (e instanceof ErrorConstructor && (e.status && e.status < 500)) return res.status(200).json({ message: 'Session logged out' });

    throw e;
  }
}, { middlewares: ['checkCSRF'] });



export default [
  Middleware.CheckCSRF([conf.domains.NEKOMI_DOMAIN]),
  endpoint
];