import HandleACUpload, { IUserControllerACUploadResponse, UserControllerACUploadMiddlewares } from './user-controller-utils';
import UserRepository from '~/repo/UserRepository';
import { HandleRequest } from '~/utils/http-utils';



/**
 * Upload user cover
 */
const endpoint = HandleRequest(async (req, res) => {
  const url = await HandleACUpload(req, UserRepository, 'uploadCover');

  return res.status(200).json({
    message: 'Cover updated!',
    url
  } satisfies IUserControllerACUploadResponse);
});



const UserPutCoverRoute = [
  ...UserControllerACUploadMiddlewares,
  endpoint
];

export default UserPutCoverRoute;