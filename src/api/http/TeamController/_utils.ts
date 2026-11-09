import express from 'express';
import multer from 'multer';

import { ROLE_PERMISSION_ENUM } from '~/domain/role.schema.js';
import { CDNString, TeamId } from '~/interfaces/BrandedIds.js';
import { TeamRepositoryClass } from '~/repositories/TeamRepository.js';
import { NekoError } from '~/services/ExceptionService.js';
import { Middleware } from '~/services/MiddlewareService.js';



type UploadMethodType = keyof Pick<TeamRepositoryClass, 'uploadAvatar' | 'uploadCover'>



const upload = multer();

export const TeamControllerACUploadMiddlewares = [
  Middleware.CheckAPIKey(),
  Middleware.CheckAccess([ROLE_PERMISSION_ENUM.enum.BASIC]),
  upload.single('file'),
];



/**
 * Handle team avatar/cover upload
 * 
 * @returns CDNString
 */
export default async function HandleTeamControllerACUpload(req: express.Request, repo: TeamRepositoryClass, method: UploadMethodType): Promise<CDNString> {
  const { id: userId, permissions } = req._nekomi.user!;
  const { id: teamId } = req.params as { id: TeamId };

  const file = req.file;
  if (!file) throw new NekoError(`sys:invalid_payload`, `File is not provided`);

  await repo.init({ id: teamId });



  // Skip validation for root
  if (!permissions?.includes(ROLE_PERMISSION_ENUM.enum.ABSOLUTE)) {
    const member = repo.document?.members.find(el => el.id === userId);

    if (!member || member.role !== 'leader') throw new NekoError('sys:action_prevented', `Only leader can update team settings`);
  }



  return repo[method](file.buffer, userId);
}