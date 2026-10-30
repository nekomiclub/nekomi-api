import conf from '~/conf';
import express from 'express';
import multer from 'multer';
import z from 'zod';
import { CDNString, asUserId } from '~/intf/BrandedIds';
import { Middleware } from '~/service/MiddlewareService';
import { NekoError } from '~/service/ExceptionService';
import { ROLE_PERMISSION } from '~/schemas/entities/Role.schema';
import { UserRepositoryClass } from '~/repo/UserRepository';



type UploadMethodType = keyof Pick<UserRepositoryClass, 'uploadAvatar' | 'uploadCover'>



const upload = multer();

export const UserControllerACUploadMiddlewares = [
  Middleware.CheckCSRF([conf.domains.NEKOMI_DOMAIN]),
  Middleware.CheckAccess([ROLE_PERMISSION.BASIC]),
  upload.single('file'),
];



const ParamSchema = z.object({
  id: z.string().nonempty().optional()
});

export const UserControllerACUploadResponse = z.object({
  message: z.string(),
  url: z.string()
});




/**
 * Handle user avatar/cover upload
 * 
 * @returns CDNString
 */
export default async function HandleUserControllerACUpload(req: express.Request, repo: UserRepositoryClass, method: UploadMethodType): Promise<CDNString> {
  const { id: userId, permissions } = req._nekomi.user!;
  const params = ParamSchema.parse(req.params);
  const targetId = asUserId(params.id ?? userId);

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