import HandleACUpload, { IUserControllerACUploadResponse, UserControllerACUploadMiddlewares } from './user-controller-utils';
import UserRepository from '~/repo/UserRepository';
import { HandleRequest } from '~/utils/http-utils';



/**
 * Upload user avatar
 */
const endpoint = HandleRequest(async (req, res) => {
  const url = await HandleACUpload(req, UserRepository, 'uploadAvatar');

  return res.status(200).json({
    message: 'Avatar updated!',
    url
  } satisfies IUserControllerACUploadResponse);
});



const UserPutAvatarRoute = [
  ...UserControllerACUploadMiddlewares,
  endpoint
];

export default UserPutAvatarRoute;