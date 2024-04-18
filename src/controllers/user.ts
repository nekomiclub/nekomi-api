import express from 'express';
import axios from 'axios';
import { validationResult } from 'express-validator';

import * as dto from '../handlers/v1/dtos';
import * as handler from '../handlers/v1/handlers';
import * as authService from '../services/v1/auth';
import * as TokenService from '../services/TokenService';

import { ErrorConstructor, E400, E401, E403, E404, writeErrorLog, catchError } from '../handlers/v1/Errors';
import User from '../Models/User';
import { config, devMode, testMode } from '../config';
import { IFKSessionToken } from '../interfaces/Fullkekw';
import Title from '../Models/Title';



export async function postSignin(req: express.Request, res: express.Response) {
  const routeCode = `${req.method} ${req.baseUrl}`;

  await catchError(req, res, routeCode, async () => {
    const { session } = req.body as { session: string };
    let id = '';

    try {
      if (testMode) {
        id = session;
      } else {
        const sessionData = await axios.post<{ msg: string, id: string }>(`${config.microservices.usapi}/auth/refresh`, {
          session
        });

        id = sessionData.data.id;
      }
    } catch (e) {
      throw new E400('Session token invalid');
    }

    const user = await User.findOne({ id });

    if (!user) {
      // TODO Create new user
      throw new E404('User with ID provided by token is not found');
    }

    return res.status(200).cookie(config.vars.sessionCookieName, session, { httpOnly: true, maxAge: 60000 * 60 * 24 * 31 }).json({ msg: 'ok' });
  });
}



export async function getLogout(req: express.Request, res: express.Response) {
  const routeCode = `${req.method} ${req.baseUrl}`;

  await catchError(req, res, routeCode, async () => {
    return res.status(205).clearCookie(config.vars.sessionCookieName).json({ msg: 'ok' });
  });
}



export async function getQuery(req: express.Request, res: express.Response) {
  const routeCode = `${req.method} ${req.baseUrl}`;

  await catchError(req, res, routeCode, async () => {
    const { query } = req.params as { query: string };

    const user = await User.findOne({ $or: [{ id: query }, { uid: query }, { username: query }] });

    if (!user) {
      throw new E400(`User ${query} is not found.`);
    }

    return res.status(200).json(dto.user(user.toObject()));
  });
}



/** PATCH /user methods. 
 * @see PATCH /user in docs/endpoints.md
 */
export const patchUserMethods = ['editFolderItem'] as const;

/** Type of patchUserMethods array */
type TPatchUserMethod = typeof patchUserMethods[number]

interface IPatchUserBody {
  /** Method */
  method: TPatchUserMethod

  //* editFolderItem method
  /** Title id to be patched */
  titleId?: string

  /** Folder id to be patched */
  folderId?: string
}

export async function patchUser(req: express.Request, res: express.Response) {
  const routeCode = `${req.method} ${req.baseUrl}`;

  await catchError(req, res, routeCode, async () => {
    // Session cookie
    const token = req.cookies[config.vars.sessionCookieName];
    const { method, folderId, titleId } = req.body as IPatchUserBody;

    let userId = '';

    if (testMode) {
      userId = token;
    } else {
      const { payload: session } = TokenService.decodeToken<IFKSessionToken>(token);
      userId = session.userId;
    }

    const user = await User.findOne({ id: userId });
    let modifyStack: string[] = [];

    if (!user) {
      throw new E404(`User ${userId} is not found`);
    }

    // Invalid method will be denied by validator
    if (method === 'editFolderItem') {
      await editFolderItem();
    }

    return res.status(200).json({ msg: 'User modified', stack: modifyStack.join('\n') });

    /** Patch folder */
    async function editFolderItem() {
      if (!folderId || !titleId || !user) {
        throw new E400(`Payload invalid${devMode && ' (see docs/endpoints.md)'}`);
      }

      const folder = user.lists.find(el => el.id === folderId);
      const title = await Title.findOne({ id: titleId });
      let modifyMsg = '';

      if (!folder) {
        throw new E400(`Folder ${folderId} is not found`);
      }

      if (!title) {
        throw new E400(`Title ${titleId} is not found`);
      }

      if (folder.titles.includes(titleId)) {
        // Delete title
        folder.titles = folder.titles.filter(el => el !== titleId);
        modifyMsg = `Title (${titleId}) deleted from folder (${folderId})`;
      } else {
        // Add title
        folder.titles.push(titleId);
        modifyMsg = `Title (${titleId}) pushed to folder (${folderId})`;
      }

      modifyStack.push(modifyMsg);
      if (devMode) console.log(`[User]: User (${userId}) modified - ${modifyMsg}`);

      try {
        user.markModified('lists');
        await user.save();
      } catch (e) {
        // Ignore
      }
    }
  });
}







export async function remove(req: express.Request, res: express.Response) {
  const routeCode = `${req.method} ${req.baseUrl}`;

  await catchError(req, res, routeCode, async () => {
    const valRes = validationResult(req);

    if (!valRes.isEmpty()) {
      return res.status(400).json(valRes.array());
    }

    const { uid } = req.body;
    const tokenData = authService.decode(req.header('Authorization')!.split('=')[1])!;
    const user = await User.findOne({ uid });

    if (!user) {
      throw new E400('User with provided ID is not found');
    }

    if (tokenData.uid !== uid && !tokenData.roles.includes('root' || 'admin' || 'moderator')) {
      throw new E403('You can not change not yours data');
    }

    await User.findOneAndDelete({ uid });

    return res.status(200).json(`UID: ${uid} deleted`);
  });
}