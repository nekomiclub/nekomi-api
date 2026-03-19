import HandleUserControllerACUpload, { UserControllerACUploadMiddlewares, UserControllerACUploadResponse } from './user-controller-utils';
import z from 'zod';
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
  } satisfies z.infer<typeof UserControllerACUploadResponse>);
}, { middlewares: ['checkAccess', 'checkCSRF'] });



export default [
  ...UserControllerACUploadMiddlewares,
  endpoint
];