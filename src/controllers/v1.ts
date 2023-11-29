import express from 'express';
import { ErrorConstructor, E400, E401, E403, E404 } from '../handlers/v1/Errors';
import * as service from '../services/v1/storage';
import { IUploadRequest, TUpload } from '../core/IUpload';

const apiUptime = +new Date();
const isDev = process.argv.some(el => el === 'devMode');
const isTest = process.argv.some(el => el === 'testMode');

export async function getTitle(req: express.Request, res: express.Response) {
  try {
    return res.send(req.params);
  } catch (e) {
    if (e instanceof ErrorConstructor) {
      console.error(e);
      return res.status(e.code).json(e);
    } else {
      console.error(e);
      return res.status(500).json(e);
    }
  }
}

export async function getTitles(req: express.Request, res: express.Response) {
  try {
    return res.send('ok');
  } catch (e) {
    if (e instanceof ErrorConstructor) {
      console.error(e);
      return res.status(e.code).json(e);
    } else {
      console.error(e);
      return res.status(500).json(e);
    }
  }
}

export async function getGS(req: express.Request, res: express.Response) {
  try {
    return res.send('ok');
  } catch (e) {
    if (e instanceof ErrorConstructor) {
      console.error(e);
      return res.status(e.code).json(e);
    } else {
      console.error(e);
      return res.status(500).json(e);
    }
  }
}

export async function uptime(req: express.Request, res: express.Response) {
  try {
    return res.status(200).json(apiUptime);
  } catch (e) {
    if (e instanceof ErrorConstructor) {
      console.error(e);
      return res.status(e.code).json(e);
    } else {
      console.error(e);
      return res.status(500).json(e);
    }
  }
}

//

interface IUploadReq extends express.Request {
  body: IUploadRequest
}

export async function upload(req: IUploadReq, res: express.Response) {
  try {
    if (!req.hostname.includes('animee.club')) {
      if (!isDev) {
        throw new E401('Uploading files can only animee.club domain.');
      }
    }

    const { file, ext, type } = req.body;

    if (!type || !ext || !file) {
      throw new E400('type and ext and file are required.');
    }

    if (type !== 'photo/series' && type !== 'photo/user/avatar' && type !== 'video/series') {
      throw new E400('type is invalid');
    }

    // @ts-expect-error 123
    const uploaded = await service.uploadTmp({ type, ext, file: Buffer.from(file.data) }, isTest);

    if (type === 'video/series') {
      // convert to webm, slice quality, create prevM
    } else if (type === 'photo/series') {
      // convert to webp, upscale, store
    } else if (type === 'photo/user/avatar') {
      // convert to webp, store
    }

    return res.status(200).json({ id: `${(isTest) ? `testid-${uploaded.id}` : uploaded.id}` });
  } catch (e) {
    if (e instanceof ErrorConstructor) {
      console.error(e);
      return res.status(e.code).json(e);
    } else {
      console.error(e);
      return res.status(500).json(e);
    }
  }
}