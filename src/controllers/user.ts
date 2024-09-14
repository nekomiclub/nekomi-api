import express from 'express';
import axios, { AxiosError } from 'axios';

import * as dto from '../handlers/dtos';
import * as handler from '../handlers/handlers';
import * as TokenService from '../services/TokenService';

import { ErrorConstructor, E400, E401, E403, E404, catchError, E501, E500 } from '../handlers/Errors';
import User, { createUser } from '../Models/User';
import { config, devMode, prodMode, testMode } from '../config';
import Title from '../Models/Title';
import { IFK_AuthorityVerify, IFK_UsapiAuthRefresh, IFK_UsapiGetUser } from '../interfaces/FullkekwResponses';
import { $http } from '../handlers/http';
import { ITitle } from '../interfaces/Title';
import { TRoleCapability } from '../interfaces/Roles';
import { TNotifyEvent } from '../services/NotifyService';
import Dubber from '../Models/Dubber';
import { Logger } from '..';
import { HandleRequest } from '../services/ErrorService';



/** Type of patchUserMethods array */
type TPatchUserMethod = 'editFolderItem' | 'patchWatchProgress'

interface IPatchUserBody {
  /** Method */
  method: TPatchUserMethod

  //* editFolderItem, patchWatchProgress methods
  titleId?: string

  //* editFolderItem method
  folderId?: string

  //* patchWatchProgress method
  dubberID?: string
  episodeOrder?: number

  /** Session viewtime in seconds */
  viewtime?: number

  /** Current video progress in seconds */
  progress?: number
}



export async function postSignin(req: express.Request, res: express.Response) {
  await catchError(req, res, async () => {
    const { session } = req.body as { session: string };
    let payload: IFK_UsapiAuthRefresh | null = null;

    if (testMode) {
      Logger.debug(`[UserController/Signin]: Refresh payload mocked due to test mode`);
      payload = handler.getMockData<IFK_UsapiAuthRefresh>(req, 'UserSignin').data;
    } else {
      try {
        // Refresh data synced
        const { data } = await $http.get<IFK_UsapiAuthRefresh>(`${config.URL.fullkekw_usapi}/auth/refresh`, {
          headers: {
            Cookie: `session=${session}`
          }
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
      Logger.info(`[UserController/Signin]: User is new, welcome!`);

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

/** @see /docs/routes/user.md */
export async function getLogout(req: express.Request, res: express.Response) {
  await catchError(req, res, async () => {
    return res.status(200).clearCookie(config.vars.sessionCookie).json({ msg: 'User logged out' });
  });
}



/** @see /docs/routes/user.md */
export async function getValidate(req: express.Request, res: express.Response) {
  await catchError(req, res, async () => {
    const session = req.cookies[config.vars.sessionCookie];

    if (session) {
      try {
        // Refresh data synced
        const { data } = await $http.get<IFK_UsapiAuthRefresh>(`${config.URL.fullkekw_usapi}/auth/refresh`, {
          headers: {
            Cookie: `session=${session}`
          }
        });

        const user = await User.findOne({ id: data.id });

        if (user) {
          if (user.username !== data.username) user.username = data.username;
          if (user.avatar !== data.avatar) user.avatar = data.avatar;

          await user.save();
        }

        return res.status(200).json({ msg: 'Session continued' });
      } catch (e) {
        return res.status(401).clearCookie(config.vars.sessionCookie).json({ msg: 'Session expired' });
      }
    } else {
      return res.status(202).json({ msg: 'Session not provided' });
    }
  });
}



/** @see /docs/routes/user.md */
export async function getQuery(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    const CSRFToken = req.header(config.vars.csrfHeader);
    const { detailed, parseLib } = req.query as { detailed?: string, parseLib?: string };

    let { query } = req.params as { query: string };
    let parsedLib: ITitle[] | null = null;
    let parsedCapabilities: TRoleCapability[] | null = null;
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

      parsedCapabilities = await handler.parseRoles(user.roles);
    }

    const lib = user.libs.find(el => el.id === parseLib);

    if (lib) {
      parsedLib = [];

      for (const key in lib.titles) {
        const titleID = lib.titles[key];
        const title = await Title.findOne({ id: titleID });

        if (!title) continue;

        parsedLib.push(dto.title(title.toObject(), privateMode));
      }
    }

    return res.status(200).json({ msg: `Ok.${privateMode ? ' Sensitive information hidden' : ''}`, user: dto.user(user.toObject(), privateMode), parsedLib, parsedCapabilities });
  });
}



/** @see /docs/routes/user.md */
export async function patchUser(req: express.Request, res: express.Response) {
  await catchError(req, res, async () => {
    const { userID } = req.animee;
    const { method } = req.body as IPatchUserBody;

    const user = await User.findOne({ id: userID });
    let modifyStack: string[] = [];

    if (!user) {
      throw new E404(`User ${userID} is not found`);
    }

    if (method === 'editFolderItem') {
      await editFolderItem();
    } else if (method === 'patchWatchProgress') {
      await patchWatchProgress();
    } else {
      throw new E400('Invalid method');
    }

    try {
      await user.save();
    } catch (e) {
      // ignore
    }

    Logger.debug(`[UserController/Patch]: User ${userID} modified. Stack - ${modifyStack.join(', ')}`);

    return res.status(200).json({ msg: 'User modified', stack: modifyStack.join('\n') });



    /** Patch folder */
    async function editFolderItem() {
      const { folderId, titleId } = req.body as IPatchUserBody;

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

      const subscribeEvent: TNotifyEvent = 'new_episode';
      const subscribe = `${subscribeEvent}/${titleId}`;

      if (folder.titles.includes(titleId)) {
        // Delete title
        folder.titles = folder.titles.filter(el => el !== titleId);

        if (folder.type === 'watching') user.subscribes = user.subscribes.filter(el => el !== subscribe);

        modifyMsg = `Title (${titleId}${folder.type === 'watching' ? ' + subscribe' : ''}) deleted from folder (${folderId})`;
      } else {
        // Add title
        folder.titles.push(titleId);

        if (folder.type === 'watching') user.subscribes.push(subscribe);

        modifyMsg = `Title (${titleId}${folder.type === 'watching' ? ' + subscribe' : ''}) pushed to folder (${folderId})`;
      }

      // Filter same
      let filteredTitles: string[] = [];

      folder.titles.forEach(title => {
        if (!filteredTitles.includes(title)) filteredTitles.push(title);
      });

      folder.titles = filteredTitles;

      modifyStack.push(modifyMsg);

      user.markModified('libs');
      user.markModified('subs');
    }

    async function patchWatchProgress() {
      const { progress, titleId, episodeOrder, dubberID, viewtime } = req.body as IPatchUserBody;

      if (!user || !viewtime || !progress || !titleId || episodeOrder === undefined || !dubberID) throw new E400('Some field are invalid or missing');
      if (isNaN(+viewtime) || isNaN(+episodeOrder) || isNaN(+progress)) throw new E400('Viewtime, episodeOrder and progress can not be NaN');

      const dubber = await Dubber.findOne({ id: dubberID });
      const title = await Title.findOne({ id: titleId });

      if (!dubber) throw new E404(`Dubber ${dubberID} is not found`);
      if (!title) throw new E404(`Title ${titleId} is not found`);

      let watchProgress = user.watchProgress.find(el => el.titleID === titleId);

      if (watchProgress) {
        watchProgress.updatedAt = handler.getUTC().timestamp;
        watchProgress.episodeOrder = episodeOrder;
        watchProgress.progress = progress;
      } else {
        watchProgress = {
          dubberID,
          episodeOrder,
          progress,
          titleID: title.id,
          updatedAt: handler.getUTC().timestamp
        };
      }

      user.statistics.viewtime += viewtime;
      user.watchProgress = [...user.watchProgress.filter(el => el.titleID !== titleId), watchProgress!];

      user.markModified('statistics');
      user.markModified('watchProgress');

      modifyStack.push(`Viewtime increased by ${+viewtime}s. Total viewtime - ${(user.statistics.viewtime / 60).toFixed(2)}m`);
    }
  });
}



/** @see /docs/routes/user.md */
export async function postLinkTelegram(req: express.Request, res: express.Response) {
  await catchError(req, res, async () => {
    const { animeeID, telegramID } = req.body as { animeeID: string, telegramID: number };

    const user = await User.findOne({ id: animeeID });
    const thisTelegramID = await User.find({ 'telegramData.id': telegramID });

    if (!user) throw new E404(`User ${animeeID} is not found`);
    if (user.telegramData || thisTelegramID.length) throw new E400('This Telegram ID already linked');

    user.statistics.isTelegramLinked = true;
    user.telegramData = {
      id: telegramID
    };

    user.markModified('statistics');

    Logger.info(`[UserController/LinkTelegram]: User ${animeeID} linked telegram with id ${telegramID}`);
    await user.save();

    return res.status(200).json({ msg: 'Account linked', username: user.username });
  });
}

export async function getLinkTelegramToken(req: express.Request, res: express.Response) {
  await catchError(req, res, async () => {
    const user = await User.findOne({ id: req.animee.userID! });

    if (!user) throw new E404('User not found');

    if (user.statistics.isTelegramLinked) throw new E403('Account already linked');

    const token = handler.makeStringID(24);

    user.telegramLinkToken = token;
    user.markModified('telegramLinkToken');

    await user.save();

    return res.status(200).json({ msg: 'ok', token });
  });
}

export async function postLinkTelegramTokenVerify(req: express.Request, res: express.Response) {
  await catchError(req, res, async () => {
    const { token } = req.body as { token: string };
    const user = await User.findOne({ telegramLinkToken: token });

    if (!user) throw new E404('User not found');

    user.telegramLinkToken = null;
    user.markModified('telegramLinkToken');

    await user.save();

    Logger.info(`[UserController/LinkTelegram]: Telegram link token verified and revoked for ${user.id}`);

    return res.status(200).json({ msg: 'ok', verified: true, id: user.id });
  });
}