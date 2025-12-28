import { HTTPEndpoint } from '~/service/HTTPService';



/**
 * Refresh session access
 */
const endpoint = HTTPEndpoint(async (req, res) => {
  return res.status(200).json({ message: 'ok' });
});



const AuthGetRefreshRoute = [
  endpoint
];

export default AuthGetRefreshRoute;