import express from 'express';
import axios, { AxiosError } from 'axios';

import * as dto from '../handlers/dtos';
import * as handler from '../handlers/handlers';
import * as TokenService from '../services/TokenService';

import { ErrorConstructor, E400, E401, E403, E404, catchError, E501, E500, writeLog } from '../handlers/Errors';
import User, { createUser } from '../Models/User';
import { config, devMode, prodMode, testMode } from '../config';
import Title from '../Models/Title';
import { IFK_AuthorityVerify, IFK_UsapiAuthRefresh, IFK_UsapiGetUser } from '../interfaces/FullkekwResponses';
import { $http } from '../handlers/http';



export async function postSignin(req: express.Request, res: express.Response) {
  await catchError(req, res, async () => {
    const { session } = req.body as { session: string };
    let payload: IFK_UsapiAuthRefresh | null = null;

    if (testMode) {
      payload = handler.getMockData<IFK_UsapiAuthRefresh>(req, 'UserSignin').data;
    } else {
      try {
        const { data } = await $http.post<IFK_UsapiAuthRefresh>(`${config.URL.fullkekw_usapi}/auth/refresh`, {
          session
        });

        payload = data;
      } catch (e) {
        if (e instanceof AxiosError) {
          if (e.code === 'ECONNREFUSED') {
            return res.status(503).json({ msg: 'FK-Usapi is not available' });
          }

          throw e;
        }

        throw e;
      }
    }

    if (!payload) throw new E400('Invalid payload');

    let user = await User.findOne({ id: payload.id });

    if (user) {
      if (user.username !== payload.username) user.username = payload.username;
      if (user.avatar !== payload.avatar) user.avatar = payload.avatar;

      await user.save();
    } else {
      // User not exist, create new one

      await createUser({
        id: payload.id,
        username: payload.username,
        avatar: payload.avatar,
      });

      user = await User.findOne({ id: payload.id });
    }

    return res.status(200).cookie(config.vars.sessionCookie, session, {
      httpOnly: true,
      maxAge: config.vars.sessionCookieExpireOffset,
      domain: prodMode ? '.animee.club' : undefined
    }).json({ msg: 'User logged in', id: payload.id, username: payload.username, avatar: payload.avatar });
  });
}

export async function getLogout(req: express.Request, res: express.Response) {
  await catchError(req, res, async () => {
    return res.status(200).clearCookie(config.vars.sessionCookie).json({ msg: 'User logged out' });
  });
}

export async function getValidate(req: express.Request, res: express.Response) {
  await catchError(req, res, async () => {
    const session = req.cookies[config.vars.sessionCookie];

    if (session) {
      try {
        await axios.post(`${config.URL.fullkekw_usapi}/auth/refresh`, {
          session
        });

        return res.status(200).json({ msg: 'Session continued' });
      } catch (e) {
        return res.status(401).clearCookie(config.vars.sessionCookie).json({ msg: 'Session expired' });
      }
    } else {
      return res.status(202).json({ msg: 'Session not provided' });
    }
  });
}

export async function getQuery(req: express.Request, res: express.Response) {
  await catchError(req, res, async () => {
    const CSRFToken = req.header(config.vars.csrfHeader);
    const { detailed } = req.query as { detailed?: boolean };
    let { query } = req.params as { query: string };

    let privateMode = true;

    // Get query from session
    if (query === '*') {
      const cookie = req.cookies[config.vars.sessionCookie];

      if (!cookie) throw new E401(`Can not get user without session cookie provided`);

      const token = TokenService.decodeToken<{ userId: string }>(cookie);
      query = token.payload!.userId;
    }

    const user = await User.findOne({ $or: [{ id: query }, { username: query }] });

    if (!user) {
      throw new E404(`User ${query} is not found.`);
    }

    if (detailed && CSRFToken) {
      const { data } = await $http.post<IFK_AuthorityVerify>(`${config.URL.fullkekw_authority}/verify`, {
        token: CSRFToken
      });

      if (data.origin === 'animee.club') {
        privateMode = !data.verified;
      }
    }

    return res.status(200).json({ msg: `Ok.${privateMode ? ' Sensitive information hidden' : ''}`, user: dto.user(user.toObject(), privateMode) });
  });
}

/** Type of patchUserMethods array */
type TPatchUserMethod = 'editFolderItem' | 'increaseViewtime'

interface IPatchUserBody {
  /** Method */
  method: TPatchUserMethod

  //* editFolderItem method
  /** Title id to be patched */
  titleId?: string

  /** Folder id to be patched */
  folderId?: string

  //* increaseViewtime method
  /** Add viewtime */
  viewtime?: number
}

export async function patchUser(req: express.Request, res: express.Response) {
  await catchError(req, res, async () => {
    const { userID } = req.animee;
    const { method, folderId, titleId, viewtime } = req.body as IPatchUserBody;

    const user = await User.findOne({ id: userID });
    let modifyStack: string[] = [];

    if (!user) {
      throw new E404(`User ${userID} is not found`);
    }

    if (method === 'editFolderItem') {
      await editFolderItem();
    } else if (method === 'increaseViewtime') {
      await increaseViewtime();
    } else {
      throw new E400('Invalid method');
    }

    try {
      await user.save();
    } catch (e) {
      // ignore
    }

    writeLog('info', `User ${userID} modified. Stack - ${modifyStack.join(', ')}`, 'patchUser');

    return res.status(200).json({ msg: 'User modified', stack: modifyStack.join('\n') });



    /** Patch folder */
    async function editFolderItem() {
      if (!folderId || !titleId || !user) {
        throw new E400(`Folder ID and title ID are required`);
      }

      const folder = user.libs.find(el => el.id === folderId);
      const title = await Title.findOne({ id: titleId });
      let modifyMsg = '';

      if (!folder) {
        throw new E404(`Folder ${folderId} is not found`);
      }

      if (!title) {
        throw new E404(`Title ${titleId} is not found`);
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

      user.markModified('libs');
    }

    async function increaseViewtime() {
      if (!user || !viewtime || isNaN(+viewtime)) throw new E400('Invalid payload or viewtime is NaN');

      user.statistics.timeSpent += +viewtime / 60;
      user.markModified('statistics');

      modifyStack.push(`Viewtime increased by ${+viewtime}s. Total viewtime - ${user.statistics.timeSpent}m`);
    }
  });
}