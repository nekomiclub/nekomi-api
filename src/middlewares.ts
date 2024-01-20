import express from 'express';
import { ErrorConstructor, E400, E401, E403, E500 } from './handlers/v1/Errors';
import { TUpload } from './core/IUpload';
import Storage from './Models/Storage';
import fs from 'fs';
import path from 'path';
import { getFileExtension } from './handlers/v1/handlers';
import { TUserRoles } from './core/IUser';
import * as authService from './services/v1/auth';
import { devMode } from './config';

const isDev = process.argv.some(el => el === 'devMode');
const isTest = process.argv.some(el => el === 'testMode');

export async function ensureAccess(accessRoles: TUserRoles[], req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const token = req.header('Authorization')?.split('=')[1];

    if (!token) {
      throw new E401('Authorization token is not provided');
    }

    const isValid = authService.verify(token, 'access');

    if (!isValid) {
      throw new E401('Access token is invalid. Refresh token by GET /refresh');
    }

    const { roles, uid, username } = authService.decode(token)!;

    if (roles.includes('root')) {
      return next();
    }

    let hasAccess = false;
    roles.forEach(role => {
      if (accessRoles.includes(role)) hasAccess = true;
    });

    if (!hasAccess) {
      throw new E403('You are not permitted to visit that endpoint');
    }

    next();
  } catch (e) {
    if (e instanceof ErrorConstructor) {
      if (devMode) console.error(e);
      return res.status(e.code).json(e);
    } else {
      if (devMode) console.error(e);
      return res.status(500).json(e);
    }
  }
}

export async function uploadValidity(req: express.Request, res: express.Response, next: express.NextFunction) {
  async function revert(id: string, URI: string | undefined, err: E400 | E401 | E403 | E500, isThrow = true) {
    await Storage.deleteOne({ id });

    if (URI) {
      fs.rmSync(URI);
    }

    if (isThrow) {
      return res.status(err.code).json(err.msg);
    }
  }

  const id = req.body.id as string;
  const quality = req.body.quality as string;
  const type = req.body.type as TUpload;
  const item = await Storage.findOne({ id }, {}, { maxTimeMS: 10000 });
  const tokenData = authService.decode(req.header('Authorization')!.split('=')[1])!;

  try {
    if (type !== 'photo/series' && type !== 'photo/user/avatar' && type !== 'video/series') {
      return await revert(id, item?.URI, new E400('Type is invalid.'));
    }

    const tPhotoExts: string[] = ['png', 'jpg', 'jpeg'];
    const tVideoExts: string[] = ['mp4', 'mkv', 'mov', 'm4v'];

    if (type.match(/^photo\//gi)) {
      if (!tPhotoExts.includes(getFileExtension(item!.URI))) {
        return await revert(id, item?.URI, new E400(`Photo uploading supports only: ${tPhotoExts.join(' ')} extensions.`));
      }
    } else if (type.match(/^video\//gi)) {
      if (!tVideoExts.includes(getFileExtension(item!.URI))) {
        return await revert(id, item?.URI, new E400(`Video uploading supports only: ${tVideoExts.join(' ')} extensions.`));
      }

      if (!quality) {
        return await revert(id, item?.URI, new E400(`Quality must be provided`));
      }

      if (!tokenData.roles.includes('root' || 'admin' || 'dubber')) {
        return await revert(id, item?.URI, new E403(`You can not upload videos`));
      }
    }

    next();
  } catch (e) {
    await revert(id, item?.URI, new E500(''), false);
    if (e instanceof ErrorConstructor) {
      if (devMode) console.error(e);
      return res.status(e.code).json(e);
    } else {
      if (devMode) console.error(e);
      return res.status(500).json(e);
    }
  }
}