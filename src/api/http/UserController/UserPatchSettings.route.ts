import { HandleRequest } from '~/utils/http-utils';



/**
 * Patch user settings
 */
const endpoint = HandleRequest(async (req, res) => {
  return res.status(200).json({ message: 'ok' });
});



const UserPatchSettingsRoute = [
  endpoint
];

export default UserPatchSettingsRoute;