import express from 'express';
import fs from 'fs';
import path from 'path';
import axios, { AxiosError } from 'axios';

import { config, devMode, prodMode, testMode } from './config';
import { TRoleCapability } from './interfaces/Roles';
import { E404, ERR_ACCESS_REJECTED, ERR_MISSING_AUTHORIZATION, HandleRequest } from './services/ErrorService';
import { MiddlewareService } from './services/MiddlewareService';
import { getMockData } from './handlers/mocks';


const Middleware = new MiddlewareService();


/** Routes access-control middleware
 * Will write user object in request animee data
 * @param capabilities An array of required capabilities. Request will be passed if at least one capability will match or array will be empty
 */
export function AccessControl(capabilities: TRoleCapability[]) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    await HandleRequest(req, res, async () => {
      const token = req.cookies[config.vars.sessionCookie] || req.header('Authorization');
      if (!token) throw new ERR_MISSING_AUTHORIZATION();

      try {
        const { user, capabilities: userCaps } = await Middleware.checkAccess(token, capabilities, testMode ? getMockData(req, 'AccessControl').data : undefined);

        req.animee.user = req.animee.user || {
          id: 'NULL',
          username: 'NULL',
          capabilities: [],
        };

        req.animee.user.id = user.id;
        req.animee.user.username = user.username;
        req.animee.user.capabilities = userCaps;
      } catch (e) {
        if (e instanceof AxiosError && (e.response?.status === 403 || e.response?.status === 400 || e.response?.status === 404)) {
          const message = 'Your session has expired. Re-login in fullkekw';

          return res.status(403).clearCookie(config.vars.sessionCookie).json({ message, msg: message, status: 403, code: 'ERR_SESSION_EXPIRED' });
        }

        throw e;
      }

      return next();
    }, true);
  };
}

/** CSRF-check middleware
 * Will write CSRF_origin in request animee data
 * @param origins Define allowed origins. To check only token validity let this array empty
 */
export function CSRFCheck(origins?: string[]) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    await HandleRequest(req, res, async () => {
      const token = req.header(config.vars.csrfHeader);
      if (!token) throw new ERR_MISSING_AUTHORIZATION('CSRF header is missing');

      const origin = await Middleware.checkCSRF(token, origins, testMode ? getMockData(req, 'CSRFCheck').data : undefined);

      req.animee.CSRF_origin = origin;

      return next();
    }, true);
  };
}