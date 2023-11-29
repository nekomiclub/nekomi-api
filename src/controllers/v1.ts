import express from 'express';
import { ErrorConstructor, E400, E401, E403, E404 } from '../handlers/v1/Errors';
import * as service from '../services/v1/storage';
import * as video from '../services/v1/video';
import Storage from '../Models/Storage';
import fs from 'fs';
import { IUploadRequest, TUpload } from '@/core/IUpload';

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
    if (!req.hostname.includes('animee.club')) {
      if (!isDev) {
        throw new E401('Uploading files can only animee.club domain.');
      }
    }

    const { id, type } = req.body as { id: string, type: TUpload };

    return res.status(200).json({ id: req.body.id });
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