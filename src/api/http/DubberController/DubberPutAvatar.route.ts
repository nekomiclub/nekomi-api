import HandleDubberControllerACUpload, { DubberControllerACUploadMiddlewares, IDubberControllerACUploadResponse } from './dubber-controller-utils';
import { DubberRepositoryClass } from '~/repo/DubberRepository';
import { HandleRequest } from '~/utils/http-utils';



/**
 * Upload dubber avatar
 */
const endpoint = HandleRequest(async (req, res) => {
  const repo = new DubberRepositoryClass();
  const url = await HandleDubberControllerACUpload(req, repo, 'uploadAvatar');

  return res.status(200).json({
    message: 'Avatar updated!',
    url
  } satisfies IDubberControllerACUploadResponse);
}, { middlewares: ['checkAccess', 'checkCSRF'] });



const DubberPutAvatarRoute = [
  ...DubberControllerACUploadMiddlewares,
  endpoint
];

export default DubberPutAvatarRoute;