import { HandleRequest } from '~/utils/http-utils';



/**
 * Upload user avatar
 */
const endpoint = HandleRequest(async (req, res) => {
  return res.status(200).json({ message: 'ok' });
});



const UserPutAvatarRoute = [
  endpoint
];

export default UserPutAvatarRoute;