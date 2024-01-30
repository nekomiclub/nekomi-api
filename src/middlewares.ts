import express from 'express';
import { ErrorConstructor, E400, E401, E403, E500 } from './handlers/v1/Errors';
import { TUpload } from './core/IUpload';
import fs from 'fs';
import path from 'path';
import { getFileExtension } from './handlers/v1/handlers';
import { TUserRoles } from './core/IUser';
import * as authService from './services/v1/auth';
import { devMode } from './config';

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