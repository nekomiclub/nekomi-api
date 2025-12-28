import SessionService from '~/service/SessionService';
import { HTTPEndpoint, getSessionToken, removeSessionCookie } from '~/service/HTTPService';



interface IResponse {
  message: string
}



/**
 * Logout session
 */
const endpoint = HTTPEndpoint(async (req, res) => {
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
    } as IResponse);
  } else {
    // Logout other session
    await session.logout(targetSessionId, currentSessionId);
    await session.save();

    return res.status(200).json({
      message: `Session "${targetSessionId}" logged out`
    } as IResponse);
  }
});



const AuthGetLogoutRoute = [
  endpoint
];

export default AuthGetLogoutRoute;