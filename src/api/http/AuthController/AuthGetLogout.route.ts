import SessionService from '~/service/SessionService';
import { HandleRequest, getSessionToken, removeSessionCookie } from '~/utils/http-utils';



interface IResponse {
  message: string
}



/**
 * Logout session
 */
const endpoint = HandleRequest(async (req, res) => {
  const params = req.params as { sessionId?: string };
  const currentSession = getSessionToken(req);

  const session = new SessionService();
  const { session: sessionData } = await session.parse(currentSession);

  const currentSessionId = sessionData.id;
  const targetSessionId = params.sessionId ?? currentSessionId;



  if (currentSessionId === targetSessionId) {
    // Logout current session
    await session.logout(targetSessionId, currentSessionId);
    await session.save();

    removeSessionCookie(res);

    return res.status(200).json({
      message: 'Session logged out'
    } satisfies IResponse);
  } else {
    // Logout other session
    await session.logout(targetSessionId, currentSessionId);
    await session.save();

    return res.status(200).json({
      message: `Session "${targetSessionId}" logged out`
    } satisfies IResponse);
  }
});



const AuthGetLogoutRoute = [
  endpoint
];

export default AuthGetLogoutRoute;