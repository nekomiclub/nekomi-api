import HandleTeamControllerACUpload, { ITeamControllerACUploadResponse, TeamControllerACUploadMiddlewares } from './team-controller-utils';
import { HandleRequest } from '~/utils/http-utils';
import { TeamRepositoryClass } from '~/repo/TeamRepository';



/**
 * Upload team cover
 */
const endpoint = HandleRequest(async (req, res) => {
  const repo = new TeamRepositoryClass();
  const url = await HandleTeamControllerACUpload(req, repo, 'uploadCover');

  return res.status(200).json({
    message: 'Cover updated!',
    url
  } satisfies ITeamControllerACUploadResponse);
}, { middlewares: ['checkAccess', 'checkCSRF'] });



const DubberPutCoverRoute = [
  ...TeamControllerACUploadMiddlewares,
  endpoint
];

export default DubberPutCoverRoute;