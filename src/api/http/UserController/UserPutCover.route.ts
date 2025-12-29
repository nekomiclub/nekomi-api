import { HandleRequest } from '~/utils/http-utils';



/**
 * Upload user cover
 */
const endpoint = HandleRequest(async (req, res) => {
  return res.status(200).json({ message: 'ok' });
});



const UserPutCoverRoute = [
  endpoint
];

export default UserPutCoverRoute;