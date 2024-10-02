import express from 'express';
import fs from 'fs';
import path from 'path';
import axios, { AxiosError } from 'axios';

import { config, devMode, prodMode, testMode } from './config';
import { TRoleCapability } from './interfaces/Roles';
import User from './Models/User';
import { getMockData, parseRoles } from './handlers/handlers';
import { IM_CSRFCheck } from './interfaces/Mocks';
import { IFK_AuthorityVerify, IFK_UsapiAuthRefresh } from './interfaces/FullkekwResponses';
import { $http } from './handlers/http';
import { E404, ERR_ACCESS_REJECTED, ERR_MISSING_AUTHORIZATION, HandleRequest } from './services/ErrorService';
import { Logger } from './services/LoggerService';



/** Routes access-control middleware
 * * Will set user data (id & caps) into animee object
 * If no capabilites are required, middleware will set only user ID.
 * 
 * Mock details
 * _AccessControl - Mock user id & REQUIRED capabilities
 * 
 * @param capabilities An array of required capabilities. Request will be passed if at least one capability will match or array will be empty
 */
export function AccessControl(capabilities: TRoleCapability[]) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    await HandleRequest(req, res, async () => {
      req.animee = req.animee || {};

      const token = req.cookies[config.vars.sessionCookie] || req.header('Authorization');

      let id = '';
      let username = '';
      let avatar = '';

      // Reject if authorization cookie is missing
      if (!token) {
        throw new ERR_MISSING_AUTHORIZATION();
      }

      if (testMode) {
        Logger.debug(`[Middleware/AccessControl]: Out request data mocked due to test mode`);

        const data = getMockData(req, 'AccessControl').data;

        id = data.id;

        if (data.capabilities) {
          capabilities = data.capabilities;
        }
      } else {
        try {
          const sessionData = await $http.get<IFK_UsapiAuthRefresh>(`${config.URL.fullkekw_usapi}/auth/refresh`, {
            headers: {
              Cookie: `session=${token}`
            }
          });

          id = sessionData.data.id;
          username = sessionData.data.username;
          avatar = sessionData.data.avatar;
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
        return next();
      }



      const user = await User.findOne({ id });

      if (!user) {
        throw new E404(`User with id provided by session token (${id}) is not found`);
      }

      if (user.username !== username) {
        Logger.debug(`[Middleware/AccessControl]: User ${user.id} username synced with fullkekw-usapi (${user.username} > ${username})`);
        user.username = username;
      }

      if (user.avatar !== avatar) {
        Logger.debug(`[Middleware/AccessControl]: User ${user.id} avatar URL synced with fullkekw-usapi`);
        user.avatar = avatar;
      }

      await user.save();
      const caps = await parseRoles(user.roles);

      req.animee.userCapabilities = caps;



      // Pass if user is root
      if (caps.includes('root')) {
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
        throw new ERR_ACCESS_REJECTED();
      }

      return next();
    }, true);
  };
}

/** CSRF-check middleware
 * 
 * Mock details
 * _CSRFCheck - Mock verified & origin
 * 
 * @param origins Define allowed origins. To check only token validity let this array empty
 */
export function CSRFCheck(origins?: string[]) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    await HandleRequest(req, res, async () => {
      origins = origins || [];

      const token = req.header(config.vars.csrfHeader);

      // Reject if header undefined
      if (!token) throw new ERR_MISSING_AUTHORIZATION('CSRF header is missing');

      let data: IM_CSRFCheck = {
        verified: false,
        origin: ''
      };

      if (testMode) {
        Logger.debug(`[Middleware/CSRFCheck]: Out request data mocked due to test mode`);
        data = getMockData<IM_CSRFCheck>(req, 'CSRFCheck').data;
      } else {
        try {
          const response = await $http.post<IFK_AuthorityVerify>(`${config.URL.fullkekw_authority}/verify`, {
            token
          });

          data = response.data;
        } catch (e) {
          if (e instanceof AxiosError) {
            if (e.code === 'ECONNREFUSED') {
              return res.status(503).json({ msg: 'FK-Authority is unavailable. Try in a few minutes' });
            }

            throw e;
          }

          throw e;
        }
      }

      // Reject if token or origin invalid
      if (!data.verified || !origins.includes(data.origin)) {
        throw new ERR_ACCESS_REJECTED('CSRF token rejected');
      }

      return next();
    }, true);
  };
}