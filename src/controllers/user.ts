import express from 'express';
import axios, { AxiosError } from 'axios';
import { validationResult } from 'express-validator';

import * as dto from '../handlers/dtos';
import * as handler from '../handlers/v1/handlers';
import * as TokenService from '../services/TokenService';

import { ErrorConstructor, E400, E401, E403, E404, writeErrorLog, catchError, E501, E500 } from '../handlers/v1/Errors';
import User, { createUser } from '../Models/User';
import { config, devMode, prodMode, testMode } from '../config';
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

    let user = await User.findOne({ id });

    // Deep find user if not find by usapi ID
    if (!user) {
      try {
        const res = await axios.get<{ msg: string, user: { id: string, username: string, email: string, photoURL: string } }>(`${config.microservices.usapi}/user/${id}`);

        const { user: data } = res.data;
        user = await User.findOne({ $or: [{ id: data.id }, { uid: data.id }, { email: data.email }, { username: data.email.split('@')[0] }] });

        if (!user) {
          // Deep find does not found user, create new one
          if (devMode) console.log(`[User]: User does not founded deeply, creating new one with id - ${id}`);

          await createUser({
            id,
            avatarURL: data.photoURL,
            username: data.username
          });

          user = await User.findOne({ id });
        } else {
          // Deep find found user, assing usapi id to it
          if (devMode) console.log(`[User]: User deep find match user by email/username, assigning new id to it`);

          user.id = id;

          await user.save();
        }
      } catch (e) {
        console.log(e);
        const emsg = `Unknown error occured while getting user with id ${id}. Stack - ${JSON.stringify(e, Object.getOwnPropertyNames(e), 2)}`;
        throw new E500(emsg);
      }
    }

    return res.status(200).cookie(config.vars.sessionCookieName, session, { httpOnly: true, maxAge: 60000 * 60 * 24 * 31, domain: prodMode ? '.animee.club' : undefined }).json({ msg: 'ok' });
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
    let { query } = req.params as { query: string };

    // Get query from session
    if (query === '*') {
      const cookie = req.cookies[config.vars.sessionCookieName];

      if (!cookie) throw new E401(`Session cookie is not provided`);

      const token = TokenService.decodeToken<{ userId: string }>(cookie);
      query = token.payload.userId;
    }

    const user = await User.findOne({ $or: [{ id: query }, { uid: query }, { username: query }] });

    if (!user) {
      throw new E404(`User ${query} is not found.`);
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
    } else {
      throw new E501('Method is not implemented');
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

      // Filter same
      let filteredTitles: string[] = [];

      folder.titles.forEach(title => {
        if (!filteredTitles.includes(title)) filteredTitles.push(title);
      });

      folder.titles = filteredTitles;

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