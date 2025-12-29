import HandleUserControllerACUpload, { IUserControllerACUploadResponse, UserControllerACUploadMiddlewares } from './user-controller-utils';
import { HandleRequest } from '~/utils/http-utils';
import { UserRepositoryClass } from '~/repo/UserRepository';



/**
 * Upload user cover
 */
const endpoint = HandleRequest(async (req, res) => {
  const repo = new UserRepositoryClass();
  const url = await HandleUserControllerACUpload(req, repo, 'uploadCover');

  return res.status(200).json({
    message: 'Cover updated!',
    url
  } satisfies IUserControllerACUploadResponse);
}, { middlewares: ['checkAccess', 'checkCSRF'] });



const UserPutCoverRoute = [
  ...UserControllerACUploadMiddlewares,
  endpoint
];

export default UserPutCoverRoute;