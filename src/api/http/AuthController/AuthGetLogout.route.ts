import { HTTPEndpoint } from '~/service/HTTPService';



/**
 * Logout session
 */
const endpoint = HTTPEndpoint(async (req, res) => {
  return res.status(200).json({ message: 'ok' });
});



const AuthGetLogoutRoute = [
  endpoint
];

export default AuthGetLogoutRoute;