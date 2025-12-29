import HandleUserControllerACUpload, { IUserControllerACUploadResponse, UserControllerACUploadMiddlewares } from './user-controller-utils';
import { HandleRequest } from '~/utils/http-utils';
import { UserRepositoryClass } from '~/repo/UserRepository';



/**
 * Upload user avatar
 */
const endpoint = HandleRequest(async (req, res) => {
  const repo = new UserRepositoryClass();
  const url = await HandleUserControllerACUpload(req, repo, 'uploadAvatar');

  return res.status(200).json({
    message: 'Avatar updated!',
    url
  } satisfies IUserControllerACUploadResponse);
}, { middlewares: ['checkAccess', 'checkCSRF'] });



const DubberPutAvatarRoute = [
  ...UserControllerACUploadMiddlewares,
  endpoint
];

export default DubberPutAvatarRoute;