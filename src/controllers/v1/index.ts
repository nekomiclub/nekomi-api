import express from 'express';
import { ErrorConstructor, E400, E401, E403, E404, writeErrorLog } from '../../handlers/v1/Errors';
import * as service from '../../services/v1/storage';
import Storage from '../../Models/Storage';
import fs from 'fs';
import { IUploadRequest, TUpload } from '../../core/IUpload';
import * as processMedia from '../../services/v1/processMedia';
import { getVideoDurationInSeconds } from 'get-video-duration';
import path from 'path';

const apiUptime = +new Date();

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

export async function media(req: express.Request, res: express.Response) {
  try {
    const { id } = req.params;

    const item = await Storage.findOne({ id });

    if (!item) {
      throw new E400('Media with that id is not found.');
    }

    return res.status(200).sendFile(item.URI);
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

export async function upload(req: express.Request, res: express.Response) {
  try {
    const { id, type, quality } = req.body as { id: string, type: TUpload, quality: processMedia.TPVQuality[] };

    await processMedia.checkConditions(id);

    try {
      if (type.match(/^photo\//gi)) {
        processMedia.processPhoto(id, type);
      } else if (type.match(/^video\//gi)) {
        processMedia.processVideo(id, quality);
      }
    } catch (e) {
      console.error(e);
      // @ts-ignore
      writeErrorLog(`An uncaught error thrown while processing ${id}. Error message: ${e.msg}`, 'controllers/v1/v1.ts/upload (RES SENDED BEFORE)');
    }

    return res.status(201).json({ id: req.body.id, frames: Math.ceil(Math.ceil(await getVideoDurationInSeconds(`${path.resolve()}/tmp/uploads/${id}.mp4`) / 5) / 25) });
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

export async function deleteUpload(req: express.Request, res: express.Response) {
  try {
    const { id } = req.body as { id: string };
    const item = await Storage.findOne({ id });

    if (!item) {
      throw new E400('Storage item with provided id is not found');
    }

    fs.rmSync(item.URI);
    await item.deleteOne();

    return res.status(20).json('ok');
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