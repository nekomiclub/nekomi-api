import express from 'express';
import { ErrorConstructor, E400, E401, E403, E404, writeErrorLog, E500, catchError } from '../../handlers/v1/Errors';
import fs from 'fs';
import { IUploadRequest, TUpload } from '../../core/IUpload';
import path from 'path';
import { config, devMode } from '../../config';
import ip from 'ip';

const apiUptime = +new Date();

export async function uptime(req: express.Request, res: express.Response) {
  return res.status(200).json(apiUptime);
}

//

export async function upload(req: express.Request, res: express.Response) {
  try {
    const file = req.file;
    const { type, qualities } = req.body;

    const token = req.header('Authorization')?.split('=')[1];
    const { roles, uid, username } = authService.decode(token!)!;

    if (!file) {
      throw new E400(`File is not provided`);
    }

    const { buffer, originalname, mimetype } = file;
    const formData = new FormData();

    formData.set('file', new Blob([buffer], { type: mimetype }), originalname);
    formData.set('type', type);
    formData.set('qualities', qualities);
    formData.set('createdBy', uid);

    const response = await axios.post(`${config.microservices.uploadsURL}/v1/upload`, formData);

    return res.status(response.status).json(response.data);
  } catch (e) {
    if (e instanceof ErrorConstructor) {
      if (devMode) console.error(e);
      return res.status(e.code).json(e);
    } else if (e instanceof AxiosError) {
      if (devMode) console.error(e.response?.data);
      return res.status(e.response?.status || 503).json(e.response?.data || { msg: 'Internal error' });
    } else {
      if (devMode) console.error(e);
      return res.status(500).json(e);
    }
  }
}

export async function updateUpload(req: express.Request, res: express.Response) {
  try {
    const file = req.file;
    const { type, qualities } = req.body;
    const { id } = req.params;

    const token = req.header('Authorization')?.split('=')[1];
    const { roles, uid, username } = authService.decode(token!)!;

    if (!file) {
      throw new E400(`File is not provided`);
    }

    const { buffer, originalname, mimetype } = file;
    const formData = new FormData();

    formData.set('file', new Blob([buffer], { type: mimetype }), originalname);
    formData.set('type', type);
    formData.set('qualities', qualities);
    formData.set('createdBy', uid);

    const response = await axios.put(`${config.microservices.uploadsURL}/v1/upload/${id}`, formData);

    return res.status(response.status).json(response.data);
  } catch (e) {
    if (e instanceof ErrorConstructor) {
      if (devMode) console.error(e);
      return res.status(e.code).json(e);
    } else if (e instanceof AxiosError) {
      if (devMode) console.error(e.response?.data);
      return res.status(e.response?.status || 503).json(e.response?.data || { msg: 'Internal error' });
    } else {
      if (devMode) console.error(e);
      return res.status(500).json(e);
    }
  }
}

export async function deleteUpload(req: express.Request, res: express.Response) {
  try {
    const { id } = req.params;
    const response = await axios.delete(`${config.microservices.uploadsURL}/v1/upload/${id}`);

    return res.status(response.status).json(response.data);
  } catch (e) {
    if (e instanceof ErrorConstructor) {
      if (devMode) console.error(e);
      return res.status(e.code).json(e);
    } else if (e instanceof AxiosError) {
      if (devMode) console.error(e.response?.data);
      return res.status(e.response?.status || 503).json(e.response?.data || { msg: 'Internal error' });
    } else {
      if (devMode) console.error(e);
      return res.status(500).json(e);
    }
  }
}


import titleUpdateDB from '../../localDB/titleUpdateDB.json' assert {type: 'json'};
import { validationResult } from 'express-validator';
export async function titleUpdate(req: express.Request, res: express.Response) {
  const routeCode = 'Service/UpdateTitle';

  await catchError(req, res, routeCode, async () => {
    const { id, year, titleId } = req.query as { id: string, year: string, titleId: string };

    const user = titleUpdateDB.users.find(el => el.id === id);

    if (!user) {
      throw new E401('User is not found');
    }

    let filtered: string[] = [];
    if (year && titleId) {
      if (!user.updated.some(el => el === titleId)) {
        titleUpdateDB.updated[year]++;
      }

      filtered = (user.updated as string[]).filter(el => el !== titleId);
      filtered.push(titleId);
    }

    const title = await Title.findOne({ id: titleId });

    (titleUpdateDB.users.find(el => el.id === id)!.updated as string[]) = filtered;

    fs.writeFileSync(`${path.resolve()}/src/localDB/titleUpdateDB.json`, JSON.stringify(titleUpdateDB, null, 2));
    let total = 0;
    titleUpdateDB.users.map(el => total = el.updated.length + total);

    return res.status(200).json({ id, total, updated: user.updated.length });
  });
}

//

import * as authService from '../../services/v1/auth';
import { IStatRecord } from '../../core/interfaces';
import axios, { AxiosError } from 'axios';
import { DAY_STAT } from '../../services/v1/stats';
import Title from '../../Models/Title';
export async function tokenVerify(req: express.Request, res: express.Response) {
  const routeCode = 'Service/VerifyToken';

  await catchError(req, res, routeCode, async () => {
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
  });
}

export async function tokenDecode(req: express.Request, res: express.Response) {
  const routeCode = ' Service/DecodeToken';

  await catchError(req, res, routeCode, async () => {
    const valRes = validationResult(req);

    if (!valRes.isEmpty()) {
      return res.status(400).json(valRes.array());
    }

    const { token } = req.body as { token: string };

    const serviceResponse = authService.decode(token.split('=')[1]);

    return res.status(200).json(serviceResponse);
  });
}