import express from 'express';
import { ErrorConstructor, E400, E401, E403, E500, E404 } from './handlers/v1/Errors';
import { TUpload } from './core/IUpload';
import fs from 'fs';
import path from 'path';
import { getFileExtension, parseRoles } from './handlers/v1/handlers';
import { TUserRoles } from './core/IUser';
import * as authService from './services/v1/auth';
import { config, devMode, prodMode, testMode } from './config';
import axios, { Axios, AxiosError } from 'axios';
import { TRoleCapability } from './interfaces/Roles';
import User from './Models/User';

/** @deprecated use AccessControl instead */
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



/** Routes access-control middleware
 * @param capabilities An array of required capabilities. If user had at least one required or array will be empty, request will be passed.
 */
export function AccessControl(capabilities: TRoleCapability[]) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const token = req.cookies[config.vars.sessionCookieName] || req.headers['authorization'];

      // Reject if authorization token is missing
      if (!token) {
        throw new E401('No authorization provided');
      }

      // Pass if no capabilities required
      if (!capabilities || !capabilities.length) {
        return next();
      }

      let id = '';

      if (testMode) {
        id = token;
      } else {
        // Verify & continue session, get user ID

        try {
          // Verify, refresh and decode session
          const sessionData = await axios.post<{ msg: string, id: string }>(`${config.microservices.usapi}/auth/refresh`, {
            session: token
          });

          id = sessionData.data.id;
        } catch (e) {

          if (e instanceof AxiosError) {
            if (devMode) console.error(e.response?.data.msg || e.response?.data.message);
            return res.status(e.response?.status || 500).json({ msg: e.response?.data.msg || e.response?.data.message || 'Service is unavailable.', at: e.response?.data.at || null, url: e.config!.url });
          } else {
            if (devMode) console.error(e);
            throw new E500(`Unknown error occured. Error stack - ${JSON.stringify(e, Object.getOwnPropertyNames(e), 2)}`);
          }
        }
      }

      const user = await User.findOne({ id });

      if (!user) {
        throw new E404(`User with id provided by session token (${id}) is not found`);
      }

      /** User roles capabilities */
      const caps = await parseRoles(user.roles);

      // Pass anyway if user is root
      if (caps.includes('root')) {
        return next();
      }

      let pass = false;

      // Check if user has all required capabilities
      capabilities!.forEach(cap => {
        if (caps.includes(cap)) {
          pass = true;
        }
      });

      if (!pass) {
        throw new E403('You are not permitted to do that');
      }

      next();
    } catch (e) {
      if (e instanceof ErrorConstructor) {
        if (devMode) console.error(`[HTTP ${e.code}]: ${JSON.stringify(e, Object.getOwnPropertyNames(e), 2)}`);
        return res.status(e.code).clearCookie(config.vars.sessionCookieName).json(e);
      } else {
        console.error(e);
        return res.status(500).json({ msg: `Unknown error occured. Error stack - ${JSON.stringify(e, Object.getOwnPropertyNames(e), 2)}` });
      }
    }
  };
}

/** CSRF-check middleware
 * @param origins Define allowed origins. To check only token validity let this array empty
 */
export function CSRFCheck(origins?: string[]) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const token = req.header('X-CSRF-Token');

      // TODO: Make test functionality
      if (testMode) {
        return next();
      }

      if (!token) throw new E403('This endpoint is secured under CSRF');

      const { data } = await axios.post<{ verified: boolean, origin: string }>(`${config.URL.fullkekw_authority}/authority/verify`, {
        token
      }, {
        validateStatus: (s) => s < 500
      });

      if (!data.verified) {
        throw new E403('CSRF invalid');
      }

      if (!origins?.length || origins.includes(data.origin)) {
        return next();
      }

      throw new E403('Origin missmatch');
    } catch (e) {
      if (e instanceof ErrorConstructor) {
        if (devMode) console.error(`[HTTP ${e.code}]: ${JSON.stringify(e, Object.getOwnPropertyNames(e), 2)}`);
        return res.status(e.code).clearCookie(config.vars.sessionCookieName).json(e);
      } else if (e instanceof AxiosError) {
        if (e.code === 'ECONNREFUSED') {
          return res.status(503).json({ msg: 'Fullkekw authority temporary unavailable. Try in a few minutes' });
        } else {
          console.error(e);
          return res.status(500).json({ msg: `Unknown error occured. Error stack - ${JSON.stringify(e, Object.getOwnPropertyNames(e), 2)}` });
        }
      } else {
        console.error(e);
        return res.status(500).json({ msg: `Unknown error occured. Error stack - ${JSON.stringify(e, Object.getOwnPropertyNames(e), 2)}` });
      }
    }
  };
}