import conf from '~/conf';
import express from 'express';
import multer from 'multer';
import { CDNString } from '~/intf/types';
import { Middleware } from '~/service/MiddlewareService';
import { NekoError } from '~/service/ExceptionService';
import { ROLE_PERMISSION } from '~/intf/IRole';
import { TeamRepositoryClass } from '~/repo/TeamRepository';
import { asTeamId } from '~/intf/ITeam';



export interface ITeamControllerACUploadResponse {
  message: string
  url: CDNString
}

type UploadMethodType = keyof Pick<TeamRepositoryClass, 'uploadAvatar' | 'uploadCover'>



const upload = multer();

export const TeamControllerACUploadMiddlewares = [
  Middleware.CheckCSRF([conf.domains.NEKOMI_DOMAIN]),
  Middleware.CheckAccess([ROLE_PERMISSION.BASIC]),
  upload.single('file'),
];



/**
 * Handle team avatar/cover upload
 * 
 * @returns CDNString
 */
export default async function HandleTeamControllerACUpload(req: express.Request, repo: TeamRepositoryClass, method: UploadMethodType): Promise<CDNString> {
  const { id: userId, permissions } = req._nekomi.user!;
  const { id: dubberId } = req.params as { id: string };

  const file = req.file;
  if (!file) throw new NekoError(`sys:invalid_payload`, `File is not provided`);

  await repo.init({ id: asTeamId(dubberId) });



  // Skip validation for root
  if (!permissions?.includes(ROLE_PERMISSION.ABSOLUTE)) {
    const member = repo.document?.members.find(el => el.id === userId);

    if (!member || member.role !== 'leader') throw new NekoError('sys:action_prevented', `Only leader can update team settings`);
  }



  return repo[method](file.buffer, userId);
}