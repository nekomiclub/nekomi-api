import express from 'express';
import { ErrorConstructor, E400, E401, E403, E404, writeErrorLog, E500 } from '../../handlers/v1/Errors';
import * as service from '../../services/v1/storage';
import Storage from '../../Models/Storage';
import fs from 'fs';
import { IUploadRequest, TUpload } from '../../core/IUpload';
import * as processMedia from '../../services/v1/processMedia';
import { getVideoDurationInSeconds } from 'get-video-duration';
import path from 'path';
import { uploadQueue } from '../../index';

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
    const { id, type, quality, relevant } = req.body as { id: string, type: TUpload, quality?: processMedia.TPVQuality[], relevant?: boolean };

    await processMedia.checkConditions(id);
    const item = await Storage.findOne({ id });

    if (!item) {
      throw new E500('Item with provided id is not found');
    }

    try {
      if (type.match(/^video/g)) {
        uploadQueue.add(id, item.URI, Array.from(quality!), type, Boolean(relevant || false));
      } else {
        processMedia.processPhoto(id, type);
      }
    } catch (e) {
      console.error(e);
      // @ts-ignore
      writeErrorLog(`An uncaught error thrown while processing ${id}. Error message: ${e.msg}`, 'controllers/v1/v1.ts/upload (RES SENDED BEFORE)');
    }

    return res.status(201).json({ id: req.body.id, frames: type.match(/^video\//gi) ? Math.ceil(Math.ceil(await getVideoDurationInSeconds(`${path.resolve()}/tmp/uploads/${id}.mp4`) / 5) / 25) : null });
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

import uploadDB from '../../localDB/uploadDB.json' assert {type: 'json'};
export async function deleteUpload(req: express.Request, res: express.Response) {
  try {
    const { id } = req.body as { id: string };
    const item = await Storage.findOne({ id });

    fs.writeFileSync(`${path.resolve()}/src/localDB/uploadDB.json`, JSON.stringify({ queue: (uploadDB.queue as processMedia.IUploadQueue[]).filter(el => el.id !== id) }, null, 2));

    if (!item) {
      throw new E400('Storage item with provided id is not found');
    }

    fs.rmSync(item.URI);
    await item.deleteOne();


    return res.status(200).json('ok');
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


import titleUpdateDB from '../../localDB/titleUpdateDB.json' assert {type: 'json'};
import { validationResult } from 'express-validator';
export async function titleUpdate(req: express.Request, res: express.Response) {
  try {
    const { id, year } = req.query as { id: string, year: string };

    const user = titleUpdateDB.users.find(el => el.id === id);

    if (!user) {
      throw new E401('User is not found');
    }

    if (year) {
      titleUpdateDB.updated[year]++;
      user.updated++;
    }

    fs.writeFileSync(`${path.resolve()}/src/localDB/titleUpdateDB.json`, JSON.stringify(titleUpdateDB, null, 2));
    let total = 0;
    titleUpdateDB.users.forEach(usr => total = total + usr.updated);

    return res.status(200).json({ id, updated: user.updated, total });
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

import * as authService from '../../services/v1/auth';
export async function tokenVerify(req: express.Request, res: express.Response) {
  try {
    const valRes = validationResult(req);

    if (!valRes.isEmpty()) {
      return res.status(400).json(valRes.array());
    }

    const { method, token } = req.body as { token: string, method: 'access' | 'refresh' };

    if (method !== 'access' && method !== 'refresh') {
      throw new E400('Token method is invalid');
    }

    const serviceResponse = authService.verify(token.split('=')[1], method);

    return res.status(200).json({ verified: serviceResponse });
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

export async function tokenDecode(req: express.Request, res: express.Response) {
  try {
    const valRes = validationResult(req);

    if (!valRes.isEmpty()) {
      return res.status(400).json(valRes.array());
    }

    const { token } = req.body as { token: string };

    const serviceResponse = authService.decode(token.split('=')[1]);

    return res.status(200).json(serviceResponse);
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