import express from 'express';
import multer from 'multer';
import z from 'zod';
import { CDNString, asUserId } from '~/interfaces/BrandedIds.js';
import { Middleware } from '~/services/MiddlewareService.js';
import { NekoError } from '~/services/ExceptionService.js';
import { ROLE_PERMISSION_ENUM } from '~/domain/role.schema.js';
import { UserRepositoryClass } from '~/repositories/UserRepository.js';



type UploadMethodType = keyof Pick<UserRepositoryClass, 'uploadAvatar' | 'uploadCover'>



const upload = multer();

export const UserControllerACUploadMiddlewares = [
  Middleware.CheckAPIKey(),
  Middleware.CheckAccess([ROLE_PERMISSION_ENUM.BASIC]),
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
    if (permissions?.includes(ROLE_PERMISSION_ENUM.ABSOLUTE)) {
      // Update target user if current user is eligible to do this

      await repo.init({ id: targetId });
    } else throw new NekoError('sys:action_prevented');
  }



  return repo[method](file.buffer);
}