import HandleTeamControllerACUpload, { ITeamControllerACUploadResponse, TeamControllerACUploadMiddlewares } from './team-controller-utils';
import { HandleRequest } from '~/utils/http-utils';
import { TeamRepositoryClass } from '~/repo/TeamRepository';



/**
 * Upload dubber avatar
 */
const endpoint = HandleRequest(async (req, res) => {
  const repo = new TeamRepositoryClass();
  const url = await HandleTeamControllerACUpload(req, repo, 'uploadAvatar');

  return res.status(200).json({
    message: 'Avatar updated!',
    url
  } satisfies ITeamControllerACUploadResponse);
}, { middlewares: ['checkAccess', 'checkCSRF'] });



const DubberPutAvatarRoute = [
  ...TeamControllerACUploadMiddlewares,
  endpoint
];

export default DubberPutAvatarRoute;