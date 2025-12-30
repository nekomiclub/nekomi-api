import conf from '~/config';
import express from 'express';
import multer from 'multer';
import { CDNString } from '~/intf/types';
import { Middleware } from '~/service/MiddlewareService';
import { NekoError } from '~/service/ExceptionService';
import { ROLE_PERMISSION } from '~/intf/IRole';
import { UserRepositoryClass } from '~/repo/UserRepository';



export interface IUserControllerACUploadResponse {
  message: string
  url: CDNString
}

type UploadMethodType = keyof Pick<UserRepositoryClass, 'uploadAvatar' | 'uploadCover'>



const upload = multer();

export const UserControllerACUploadMiddlewares = [
  Middleware.CheckCSRF([conf.domains.NEKOMI_DOMAIN]),
  Middleware.CheckAccess([ROLE_PERMISSION.BASIC]),
  upload.single('file'),
];



/**
 * Handle user avatar/cover upload
 * 
 * @returns CDNString
 */
export default async function HandleUserControllerACUpload(req: express.Request, repo: UserRepositoryClass, method: UploadMethodType): Promise<CDNString> {
  const { id: userId, permissions } = req._nekomi.user!;
  const params = req.params as { id?: string };
  const targetId = params.id ?? userId;

  const file = req.file;
  if (!file) throw new NekoError(`sys:invalid_payload`, `File is not provided`);



  if (userId === targetId) {
    // Update current user

    await repo.init({ id: userId });
  } else {
    if (permissions?.includes(ROLE_PERMISSION.ABSOLUTE)) {
      // Update target user if current user is eligible to do this

      await repo.init({ id: targetId });
    } else throw new NekoError('sys:action_prevented');
  }



  return repo[method](file.buffer);
}