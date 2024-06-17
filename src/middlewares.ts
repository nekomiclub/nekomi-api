import express from 'express';
import { ErrorConstructor, E400, E401, E403, E500, E404, catchError } from './handlers/Errors';
import fs from 'fs';
import path from 'path';
import { config, devMode, prodMode, testMode } from './config';
import axios, { Axios, AxiosError } from 'axios';
import { TRoleCapability } from './interfaces/Roles';
import User from './Models/User';
import { getMockData, parseRoles } from './handlers/handlers';



/** Routes access-control middleware
 * @param capabilities An array of required capabilities. If user had at least one required or array will be empty, request will be passed. Will set user data (id & caps) into animee object.
 */
export function AccessControl(capabilities: TRoleCapability[]) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    await catchError(req, res, async () => {
      req.animee = req.animee || {};

      const token = req.cookies[config.vars.sessionCookie] || req.headers['authorization'];

      // Reject if authorization token is missing
      if (!token) {
        throw new E401('No authorization provided');
      }

      // Pass if no capabilities required
      if (!capabilities || !capabilities.length) {
        try {
          const sessionData = await axios.post<{ msg: string, id: string }>(`${config.microservices.usapi}/auth/refresh`, {
            session: token
          });

          req.animee.userID = sessionData.data.id;
        } catch (e) {
          // Ignore
        }

        return next();
      }

      let id = '';

      // Verify & continue session, get user ID

      try {
        // Verify, refresh and decode session
        const sessionData = await axios.post<{ msg: string, id: string }>(`${config.microservices.usapi}/auth/refresh`, {
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

      const user = await User.findOne({ id });

      if (!user) {
        throw new E404(`User with id provided by session token (${id}) is not found`);
      }

      /** User roles capabilities */
      const caps = await parseRoles(user.roles);

      req.animee.userID = user.id;
      req.animee.userCapabilities = caps;

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
    }, true);
  };
}

/** CSRF-check middleware
 * In development or test mode you can pass token like "*-SERVICE_NAME". 
 * 
 * @param origins Define allowed origins. To check only token validity let this array empty
 */
export function CSRFCheck(origins?: string[]) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    await catchError(req, res, async () => {
      origins = origins || [];

      const token = req.header(config.vars.csrfHeader);

      // Reject if header undefined
      if (!token) throw new E403('CSRF required');

      let data: { verified: boolean, origin: string } = {
        verified: false,
        origin: ''
      };

      if (testMode) {
        data = getMockData(req, 'key_1').data;
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