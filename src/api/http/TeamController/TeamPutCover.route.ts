import HandleTeamControllerACUpload, { TeamControllerACUploadMiddlewares, TeamControllerACUploadResponseSchema } from './team-controller-utils';
import z from 'zod';
import { HandleRequest } from '~/utils/http-utils';
import { TeamRepositoryClass } from '~/repo/TeamRepository';



/**
 * Upload team cover
 */
const endpoint = HandleRequest(async (req, res) => {
  const url = await HandleTeamControllerACUpload(req, new TeamRepositoryClass(), 'uploadCover');

  return res.status(200).json({
    message: 'Cover updated!',
    url
  } satisfies z.infer<typeof TeamControllerACUploadResponseSchema>);
}, { middlewares: ['checkAccess', 'checkCSRF'] });



export default [
  ...TeamControllerACUploadMiddlewares,
  endpoint
];