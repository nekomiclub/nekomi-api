import HandleDubberControllerACUpload, { DubberControllerACUploadMiddlewares, IDubberControllerACUploadResponse } from './dubber-controller-utils';
import { DubberRepositoryClass } from '~/repo/DubberRepository';
import { HandleRequest } from '~/utils/http-utils';



/**
 * Upload dubber cover
 */
const endpoint = HandleRequest(async (req, res) => {
  const repo = new DubberRepositoryClass();
  const url = await HandleDubberControllerACUpload(req, repo, 'uploadCover');

  return res.status(200).json({
    message: 'Cover updated!',
    url
  } satisfies IDubberControllerACUploadResponse);
}, { middlewares: ['checkAccess', 'checkCSRF'] });



const DubberPutCoverRoute = [
  ...DubberControllerACUploadMiddlewares,
  endpoint
];

export default DubberPutCoverRoute;