import express from 'express';

import { E401, HTTPErrorConstructor, HandleRequest } from './services/ErrorService';
import { ERROR } from './services/ErrorService';
import { GetCheckAccessMock, GetCheckCSRFMock } from './utils/testing-utils';
import { MiddlewareService } from './services/MiddlewareService';
import { RoleCapability } from '~/core/interfaces/Role.intf';
import { TestMode, config } from './config';


const Middleware = new MiddlewareService();



/** Routes access-control middleware
 * Will write user object in request nekomi data
 * @param capabilities An array of required capabilities. Request will be passed if at least one capability will match or array will be empty
 */
export function CheckAccess(capabilities: RoleCapability[]) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    await HandleRequest(req, res, async () => {
      req.nekomi.middlewaresPassed = req.nekomi.middlewaresPassed || [];
      req.nekomi.middlewaresPassed.push('checkAccess');

      const token = req.cookies[config.vars.sessionCookie] || req.header('Authorization');
      if (!token) throw new E401;

      try {
        const { user, capabilities: userCaps } = await Middleware.checkAccess({
          token,
          capabilities,
          mock: TestMode ? GetCheckAccessMock(req) : undefined
        });

        req.nekomi.user = req.nekomi.user || {
          id: 'NULL',
          username: 'NULL',
          capabilities: [],
        };

        req.nekomi.user.id = user.id;
        req.nekomi.user.username = user.username;
        req.nekomi.user.capabilities = userCaps;
      } catch (e) {
        if (e instanceof HTTPErrorConstructor && e.code === ERROR.AUTH_SESSION_EXPIRED) {
          res.clearCookie(config.vars.sessionCookie);
        }

        throw e;
      }

      return next();
    });
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
      if (!token) throw new E401('CSRF header is missing');

      const origin = await Middleware.checkCSRF({
        token,
        origins,
        mock: TestMode ? GetCheckCSRFMock(req) : undefined
      });

      return next();
    });
  };
}