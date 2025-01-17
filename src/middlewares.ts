import express from 'express';
import { AxiosError } from 'axios';

import { ERR_MISSING_AUTHORIZATION, HandleRequest } from './services/ErrorService';
import { MiddlewareService } from './services/MiddlewareService';
import { TRoleCapability } from './interfaces/Roles';
import { TestMode, config } from './config';
import { getMockData } from './handlers/mocks';


const Middleware = new MiddlewareService();


/** Routes access-control middleware
 * Will write user object in request nekomi data
 * @param capabilities An array of required capabilities. Request will be passed if at least one capability will match or array will be empty
 */
export function CheckAccess(capabilities: TRoleCapability[]) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    await HandleRequest(req, res, async () => {
      const token = req.cookies[config.vars.sessionCookie] || req.header('Authorization');
      if (!token) throw new ERR_MISSING_AUTHORIZATION();

      req.nekomi.middlewaresPassed = req.nekomi.middlewaresPassed || [];
      req.nekomi.middlewaresPassed.push('checkAccess');

      try {
        const { user, capabilities: userCaps } = await Middleware.checkAccess(token, capabilities, TestMode ? getMockData(req, 'FkUsapiAuthRefresh').data : undefined);

        req.nekomi.user = req.nekomi.user || {
          id: 'NULL',
          username: 'NULL',
          capabilities: [],
        };

        req.nekomi.user.id = user.id;
        req.nekomi.user.username = user.username;
        req.nekomi.user.capabilities = userCaps;
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
 * @param origins Define allowed origins. To check only token validity let this array empty
 */
export function CheckCSRF(origins?: string[]) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    await HandleRequest(req, res, async () => {
      req.nekomi.middlewaresPassed = req.nekomi.middlewaresPassed || [];
      req.nekomi.middlewaresPassed.push('checkCSRF');

      const token = req.header(config.vars.csrfHeader);
      if (!token) throw new ERR_MISSING_AUTHORIZATION('CSRF header is missing');

      const origin = await Middleware.checkCSRF(token, origins, TestMode ? getMockData(req, 'FkAuthorityVerify').data : undefined);

      return next();
    }, true);
  };
}