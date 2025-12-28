import SessionService from '~/service/SessionService';
import { HandleRequest, getSessionToken, setSessionCookie } from '~/utils/http-utils';



interface IResponse {
  message: string
  user: {
    id: string
    username: string
    avatar: string
    cover: string
  }
}



/**
 * Refresh session access
 */
const endpoint = HandleRequest(async (req, res) => {
  const sessionToken = getSessionToken(req);
  const session = new SessionService();
  const { user, session: sessionData } = await session.parse(sessionToken);

  const refreshedSessionToken = await session.refresh(sessionData.id);
  await session.save();



  setSessionCookie(refreshedSessionToken, res);

  return res.status(200).json({
    message: 'Access refreshed',
    user: {
      id: user.username,
      username: user.username,
      avatar: user.avatar,
      cover: user.cover
    }
  } as IResponse);
});



/** @deprecated redudant */
const AuthGetRefreshRoute = [
  endpoint
];

export default AuthGetRefreshRoute;