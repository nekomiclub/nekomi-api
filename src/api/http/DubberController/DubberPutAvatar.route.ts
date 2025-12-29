import HandleDubberControllerACUpload from './dubber-controller-utils';
import { DubberRepositoryClass } from '~/repo/DubberRepository';
import { HandleRequest } from '~/utils/http-utils';
import { IUserControllerACUploadResponse, UserControllerACUploadMiddlewares } from '~/api/http/UserController/user-controller-utils';



/**
 * Upload dubber avatar
 */
const endpoint = HandleRequest(async (req, res) => {
  const repo = new DubberRepositoryClass();
  const url = await HandleDubberControllerACUpload(req, repo, 'uploadAvatar');

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