import express from 'express';
import fs from 'fs';
import path from 'path';
import axios, { Axios, AxiosError } from 'axios';

import { ErrorConstructor, E400, E401, E403, E500, E404, catchError, writeLog } from './handlers/Errors';
import { config, devMode, prodMode, testMode } from './config';
import { TRoleCapability } from './interfaces/Roles';
import User from './Models/User';
import { getMockData, parseRoles } from './handlers/handlers';



/** Routes access-control middleware
 * * Will set user data (id & caps) into animee object
 * If no capabilites are required, middleware will set only user ID.
 * 
 * Mock details
 * ac_1 - Mock user id (string) & REQUIRED capabilities (TRoleCapability[])
 * 
 * @param capabilities An array of required capabilities. Request will be passed if at least one capability will match or array will be empty
 */
export function AccessControl(capabilities: TRoleCapability[]) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    await catchError(req, res, async () => {
      req.animee = req.animee || {};

      const token = req.cookies[config.vars.sessionCookie] || req.header('Authorization');

      let id = '';

      // Reject if authorization cookie is missing
      if (!token) {
        throw new E401('No authorization provided');
      }

      if (testMode) {
        const data = getMockData(req, 'ac_1').data;

        id = data.id;

        if (data.capabilities) {
          capabilities = data.capabilities;
        }
      } else {
        try {
          const sessionData = await axios.post<{ msg: string, id: string }>(`${config.URL.fullkekw_usapi}/auth/refresh`, {
            session: token
          });

          id = sessionData.data.id;
        } catch (e) {
          if (e instanceof AxiosError) {
            if (e.response?.status === 403) {
              return res.status(403).clearCookie(config.vars.sessionCookie).json({ msg: 'Session expired' });
            }

            if (e.code === 'ECONNREFUSED') {
              return res.status(503).json({ msg: 'FK-Usapi is unavailable. Try in a few minutes' });
            }

            throw e;
          } else {
            throw e;
          }
        }
      }

      req.animee.userID = id;

      // Pass if no capabilities are required
      if (capabilities.length === 0) {
        if (devMode) writeLog('debug', `Request passed via AccessControl due to empty required caps array`, 'middlewares/AccessControl');
        return next();
      }



      const user = await User.findOne({ id });

      if (!user) {
        throw new E404(`User with id provided by session token (${id}) is not found`);
      }

      const caps = await parseRoles(user.roles);

      req.animee.userCapabilities = caps;



      // Pass if user is root
      if (caps.includes('root')) {
        if (devMode) writeLog('debug', `Request passed via AccessControl due to root role`, 'middlewares/AccessControl');
        return next();
      }

      let pass = false;

      // Check if user has all required capabilities
      capabilities.forEach(cap => {
        if (caps.includes(cap)) {
          pass = true;
        }
      });

      if (!pass) {
        throw new E403('Access rejected');
      }

      return next();
    }, true);
  };
}

/** CSRF-check middleware
 * 
 * Mock details
 * csrf_1 - Mock verified (boolean) & origin (string)
 * 
 * @param origins Define allowed origins. To check only token validity let this array empty
 */
export function CSRFCheck(origins?: string[]) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    await catchError(req, res, async () => {
      origins = origins || [];

      const token = req.header(config.vars.csrfHeader);

      // Reject if header undefined
      if (!token) throw new E401('CSRF required');

      let data: { verified: boolean, origin: string } = {
        verified: false,
        origin: ''
      };

      if (testMode) {
        data = getMockData(req, 'csrf_1').data;
      } else {
        const response = await axios.post(`${config.URL.fullkekw_authority}/verify`, {
          token
        });

        data = response.data;
      }

      // Reject if token invalid
      if (!data.verified) {
        throw new E403('CSRF rejected');
      }

      // Reject if origin invalid
      if (!origins.includes(data.origin)) {
        throw new E403('CSRF origin missmatch');
      }

      return next();
    }, true);
  };
}