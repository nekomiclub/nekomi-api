import { HandleRequest } from '~/utils/http-utils';



/**
 * Get user by query or by session (query="*")
 * 
 * Query "*" will retrieve user id from session, otherwise throw an error
 * 
 */
const endpoint = HandleRequest(async (req, res) => {
  const { query } = req.params as { query: string };





  return res.status(200).json({ message: 'ok' });
});



const UserGetRoute = [
  endpoint
];

export default UserGetRoute;