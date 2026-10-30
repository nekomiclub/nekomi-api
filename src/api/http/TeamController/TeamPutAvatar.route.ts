import HandleTeamControllerACUpload, { TeamControllerACUploadMiddlewares, TeamControllerACUploadResponseSchema } from './team-controller-utils';
import z from 'zod';
import { HandleRequest } from '~/utils/http-utils';
import { TeamRepositoryClass } from '~/repo/TeamRepository';



export const PutTeamAvatarResponseSchema = TeamControllerACUploadResponseSchema;



/**
 * Upload dubber avatar
 */
const endpoint = HandleRequest(async (req, res) => {
  const url = await HandleTeamControllerACUpload(req, new TeamRepositoryClass(), 'uploadAvatar');

  return res.status(200).json({
    message: 'Avatar updated!',
    url
  } satisfies z.infer<typeof PutTeamAvatarResponseSchema>);
}, { middlewares: ['checkAccess', 'checkCSRF'] });



export default [
  ...TeamControllerACUploadMiddlewares,
  endpoint
];