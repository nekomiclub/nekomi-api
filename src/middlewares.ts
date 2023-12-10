import express from 'express';
import { ErrorConstructor, E400, E401, E403, E500 } from './handlers/v1/Errors';
import { TUpload } from './core/IUpload';
import Storage from './Models/Storage';
import fs from 'fs';
import path from 'path';
import { getFileExtension } from './handlers/v1/handlers';

const isDev = process.argv.some(el => el === 'devMode');
const isTest = process.argv.some(el => el === 'testMode');

export async function privateRoute(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    if (!req.hostname.includes('animee.club')) {
      if (!isDev) {
        throw new E403('This route is accesible only from animee.club domain.');
      }
    }
  } catch (e) {
    if (e instanceof ErrorConstructor) {
      console.error(e);
      return res.status(e.code).json(e);
    } else {
      console.error(e);
      return res.status(500).json(e);
    }
  }

  next();
}

export async function uploadValidity(req: express.Request, res: express.Response, next: express.NextFunction) {
  async function revert(id: string, URI: string | undefined, err: E400 | E401 | E403 | E500, isThrow = true) {
    await Storage.deleteOne({ id });

    if (URI) {
      fs.rmSync(URI);
    }

    if (isThrow) {
      throw err;
    }
  }

  const id = req.body.id as string;
  const quality = req.body.quality as string;
  const type = req.body.type as TUpload;
  const item = await Storage.findOne({ id });

  try {
    if (type !== 'photo/series' && type !== 'photo/user/avatar' && type !== 'video/series') {
      return await revert(id, item?.URI, new E400('Type is invalid.'));
    }

    const tPhotoExts: string[] = ['png', 'jpg', 'jpeg'];
    const tVideoExts: string[] = ['mp4'];

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
    }

  } catch (e) {
    await revert(id, item?.URI, new E500(''), false);
    if (e instanceof ErrorConstructor) {
      console.error(e);
      return res.status(e.code).json(e);
    } else {
      console.error(e);
      return res.status(500).json(e);
    }
  }

  next();
}