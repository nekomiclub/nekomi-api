import express from 'express';
import { AxiosError } from 'axios';

import * as TokenService from '~/services/TokenService';

import * as Role from '~/models/Role';
import AnimeModel from '~/core/models/AnimeModel';
import FullkekwAuthorityAPI from '~/core/services/API/FullkekwAuthorityApi';
import FullkekwUserAPI from '~/core/services/API/FullkekwUserAPI';
import Search from '~/services/SearchService';
import Title from '~/models/Title';
import User, { UserModel, UserService } from '~/models/User';
import { Anime } from '~/core/interfaces/AnimeIntf';
import { E404, ERR_ACCESS_REJECTED, ERR_ALREADY_EXIST, ERR_INVALID_PAYLOAD, ERR_MIDDLEWARE_REQUIRED, ERR_MISSING_AUTHORIZATION, ERR_TYPE_INVALID, HandleRequest } from '~/services/ErrorService';
import { FullkekwAuthorityAPI_TokenVerify } from '~/core/interfaces/API/FullkekwAuthorityAPI.intf';
import { FullkekwUserAPI_TokenData } from '~/core/interfaces/API/FullkekwUserAPI.intf';
import { IM_FkAuthorityVerify } from '~/interfaces/types';
import { IUserTogetherRoom } from '~/core/interfaces/UserIntf';
import { Logger } from '~/services/LoggerService';
import { MongoDocumentDTO } from '~/core/services/DTO';
import { ProductionMode, TestMode, config } from '~/config';
import { TRoleCapability } from '~/core/interfaces/RoleIntf';
import { getMockData } from '~/utils/deprecated-utils';




/** Type of patchUserMethods array */
type TPatchUserMethod = 'editFolderItem' | 'patchWatchProgress' | 'upload_banner'

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
  await HandleRequest(req, res, async () => {
    if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);

    const { session } = req.body as { session: string };

    // @ts-expect-error Need empty object
    const DATA: FullkekwUserAPI_TokenData = {};



    // Validate session
    if (!TestMode) {
      const data = await FullkekwUserAPI.refreshAuth({ sessionCookie: session });

      DATA.id = data.id;
      DATA.avatar = data.avatar;
      DATA.username = data.username;
    } else {
      const { data } = getMockData<FullkekwUserAPI_TokenData>(req, 'FkUsapiAuthRefresh');

      DATA.id = data.id;
      DATA.avatar = data.avatar;
      DATA.username = data.username;
    }

    let user = await User.findOne({ id: DATA.id });
    let isUserNew = false;

    if (user) {
      // Sync nekomi data with fullkekw user api
      const patch = new UserService({ user });

      if (user.username !== DATA.username) { await patch.patchUsername({ username: DATA.username, bypassValidation: true }); await patch.save(); }
      if (user.avatar !== DATA.avatar) { await patch.patchAvatar({ url: DATA.avatar }); await patch.save(); }

      isUserNew = false;
    } else {
      // User is not found, create new
      Logger.info(`[UserController]: New user signed in, welcome!`);

      user = await UserService.create(DATA);
      isUserNew = true;
      Search.update('user');
    }



    return res.status(isUserNew ? 201 : 200).cookie(config.vars.sessionCookie, session, {
      httpOnly: true,
      maxAge: config.vars.sessionCookieExpireOffset,
      domain: ProductionMode ? `.${config.DOMAIN.nekomi}` : undefined
    }).json({
      message: 'User signed in',
      id: DATA.id,
      username: DATA.username,
      avatar: DATA.avatar
    });
  });
}

/** @see /docs/routes/user.md */
export async function getLogout(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);

    return res.status(200).clearCookie(config.vars.sessionCookie, {
      httpOnly: true,
      domain: ProductionMode ? `.${config.DOMAIN.nekomi}` : undefined
    }).json({ message: `Logged out` });
  });
}



/** @see /docs/routes/user.md */
export async function getValidate(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);

    const token = req.cookies[config.vars.sessionCookie];
    if (!token) return res.status(202).json({ message: 'Session not provided' });

    // @ts-expect-error Need empty object
    const session: FullkekwUserAPI_TokenData = {};

    try {
      if (!TestMode) {
        // Sync nekomi data with fullkekw user api
        const data = await FullkekwUserAPI.refreshAuth({ sessionCookie: token });

        session.id = data.id;
        session.avatar = data.avatar;
        session.username = data.username;
      } else {
        const { data } = getMockData(req, 'FkUsapiAuthRefresh');

        session.id = data.id;
        session.avatar = data.avatar;
        session.username = data.username;
      }
    } catch (e) {
      if (e instanceof AxiosError) {
        if (e.code === 'ECONNREFUSED') throw e;

        return res.status(401).clearCookie(config.vars.sessionCookie).json({ message: 'Session expired' });
      } else {
        throw e;
      }
    }

    const user = await User.findOne({ id: session.id });
    if (!user) throw new E404(`User ${session.id} is not found. Create new nekomi account`);

    const patch = new UserService({ user });

    if (user.username !== session.username) await patch.patchUsername({ username: session.username, bypassValidation: true });
    if (user.avatar !== session.avatar) await patch.patchAvatar({ url: session.avatar });

    await patch.save();

    return res.status(200).json({ message: 'Session continued' });
  });
}



/** @see /docs/routes/user.md */
export async function getQuery(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    const CSRFToken = req.header(config.vars.csrfHeader);

    const { detailed, parseLib, parseRoles, togetherRoomId } = req.query as { detailed?: boolean, parseLib?: string, parseRoles?: boolean, togetherRoomId?: string };
    let { query } = req.params as { query: string };

    let privateMode = true; // If private mode is true, client can not get some private information
    let parsedRoles: TRoleCapability[] | undefined = undefined;
    let parsedLib: Anime[] | undefined = undefined;
    let togetherRoom: IUserTogetherRoom | undefined = undefined;



    // Get user by session
    if (query === '*') {
      const DATA: FullkekwUserAPI_TokenData = {
        avatar: '',
        id: '',
        username: ''
      };

      const token = req.cookies[config.vars.sessionCookie];
      if (!token) throw new ERR_MISSING_AUTHORIZATION(`Can not get own data (*) without session cookie provided`);

      if (!TestMode) {
        try {
          const data = await FullkekwUserAPI.refreshAuth({ sessionCookie: token });

          DATA.username = data.username;
        } catch (e) {
          if (e instanceof AxiosError) {
            if (e.code === 'ECONNREFUSED') throw e;

            return res.status(401).clearCookie(config.vars.sessionCookie).json({ message: 'Session expired' });
          } else {
            throw e;
          }
        }
      } else {
        const { data } = getMockData<FullkekwUserAPI_TokenData>(req, 'FkUsapiAuthRefresh');

        DATA.username = data.username;
      }

      query = DATA.username;
    }

    const user = await User.findOne({ $or: [{ id: query }, { username: query }] });
    if (!user) throw new E404(`User ${query} is not found`);

    // Check if client can get detailed info
    if (detailed !== undefined && CSRFToken !== undefined) {
      const DATA: FullkekwAuthorityAPI_TokenVerify = {
        origin: '',
        verified: false
      };

      if (!TestMode) {
        const data = await FullkekwAuthorityAPI.verifyToken({ token: CSRFToken });

        DATA.origin = data.origin;
        DATA.verified = data.verified;
      } else {
        const { data } = getMockData<IM_FkAuthorityVerify>(req, 'FkAuthorityVerify');

        DATA.origin = data.origin;
        DATA.verified = data.verified;
      }

      if (DATA.verified && DATA.origin === config.DOMAIN.nekomi) {
        privateMode = !DATA.verified;
      } else {
        throw new ERR_ACCESS_REJECTED(`Can not get detailed user information due to token error`);
      }
    }

    // Parse user capabilities is client can get detailed info
    // TODO: !privateMode && parseRoles !== undefined
    if (!privateMode) {
      parsedRoles = await Role.parseRoles(user.roles);
    }

    // Parse user lib titles
    if (!privateMode && parseLib !== undefined) {
      const lib = user.libs.find(el => el.id === parseLib);
      if (!lib) throw new E404(`Lib ${parseLib} is not found`);

      parsedLib = (await AnimeModel.find({ uuid: { $in: lib.titles } })).map(title => new MongoDocumentDTO().anime({ document: title, details: !privateMode }));
    }

    // Fetch together room
    if (!privateMode && togetherRoomId !== undefined) {
      const room = user.togetherRooms.find(el => el.id === togetherRoomId);
      if (!room) throw new E404(`Room ${togetherRoomId} is not found`);

      togetherRoom = room;
    }



    return res.status(200).json({
      message: `OK. ${privateMode ? 'Sensetive information hidden.' : 'Sensetive information returned.'}`,
      user: new MongoDocumentDTO().user({ document: user, details: !privateMode }),
      parsedLib,
      parsedRoles,
      togetherRoom,
    });
  });
}



/** @see /docs/routes/user.md */
export async function patchUser(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    if (!req.nekomi.middlewaresPassed?.includes('checkAccess')) throw new ERR_MIDDLEWARE_REQUIRED(`checkAccess`);
    if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);

    const { id } = req.nekomi.user!;
    const { method } = req.body as IPatchUserBody;



    const user = (await User.findOne({ id }))!;

    const patcher = new UserService({ user });
    const HANDLERS: { [type in TPatchUserMethod]: () => Promise<void> } = {
      editFolderItem,
      patchWatchProgress,
      upload_banner,
    };

    const handler = HANDLERS[method];
    if (!handler) throw new ERR_INVALID_PAYLOAD(`Method ${method} is invalid`);

    await handler();
    await patcher.save();



    return res.status(200).json({ message: 'User modified', stack: patcher.stack.join('\n') });



    async function editFolderItem() {
      const { folderId, titleId } = req.body as IPatchUserBody;
      if (!folderId || !titleId) throw new ERR_INVALID_PAYLOAD();

      const lib = patcher.user.libs.find(el => el.id === folderId);
      if (!lib) throw new E404(`Lib ${folderId} is not found`);

      const title = await Title.findOne({ id: titleId });
      if (!title) throw new E404(`Title ${titleId} is not found`);

      if (!lib.titles.includes(titleId)) {
        // Add title & event
        await patcher.addToLib({ libID: folderId, titleID: titleId });

        if (lib.type === 'watching') await patcher.addSubscribe({ event: 'new_episode', key: titleId });

        // Add airing_started subscribe if there is no episodes in title and status is announcement or ongoing
        if (
          lib.type === 'plans' &&
          title.episodes.length === 0 &&
          (title.status === 'announcement' || title.status === 'ongoing')
        ) await patcher.addSubscribe({ event: 'airing_started', key: titleId });
      } else {
        // Remove title & event
        await patcher.removeFromLib({ libID: folderId, titleID: titleId });

        if (lib.type === 'watching') await patcher.removeSubscribe({ event: 'new_episode', key: titleId });
        if (lib.type === 'plans') await patcher.removeSubscribe({ event: 'airing_started', key: titleId });
      }
    }

    async function patchWatchProgress() {
      const { progress, titleId, episodeOrder, dubberID, viewtime } = req.body as IPatchUserBody;

      if (!titleId || !dubberID || viewtime === undefined || progress === undefined || episodeOrder === undefined) throw new ERR_INVALID_PAYLOAD();
      if (isNaN(+viewtime) || isNaN(+episodeOrder) || isNaN(+progress)) throw new ERR_TYPE_INVALID('Viewtime, episodeOrder and progress can not be NaN');

      await patcher.patchWatchProgress({ dubberID, titleID: titleId, episodeOrder, progress, updatedAt: 0 });
      await patcher.patchStatistics({ viewtime });
    }

    async function upload_banner() {
      const file = req.file;
      if (!file) throw new ERR_TYPE_INVALID(`File is not provided`);

      await patcher.uploadBanner({ file });
    }
  });
}



/** @see /docs/routes/user.md */
export async function postLinkTelegram(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);

    const { animeeID, telegramID } = req.body as { animeeID: string, telegramID: number };

    const user = await User.findOne({ id: animeeID });
    if (!user) throw new E404(`User ${animeeID} is not found`);

    const userWithThisTelegramID = await User.findOne({ 'telegramData.id': telegramID });
    if (user.statistics.isTelegramLinked || userWithThisTelegramID) throw new ERR_ALREADY_EXIST('This Telegram ID already linked');

    const patch = new UserService({ user });

    await patch.patchStatistics({ isTelegramLinked: true });
    await patch.patchTelegramData({ id: telegramID });
    await patch.save();

    Logger.info(`[UserController]: User ${animeeID} linked telegram with id ${telegramID}`);

    return res.status(200).json({ message: 'Account linked', username: user.username });
  });
}

// TODO: Write in docs. Issue new telegram link token for user
export async function getLinkTelegramToken(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    if (!req.nekomi.middlewaresPassed?.includes('checkAccess')) throw new ERR_MIDDLEWARE_REQUIRED(`checkAccess`);
    if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);

    const user = (await User.findOne({ id: req.nekomi.user?.id }))!;
    if (user.statistics.isTelegramLinked) throw new ERR_ALREADY_EXIST('Account already linked');

    const patch = new UserService({ user });
    const token = TokenService.TokenService.signToken('TelegramLink');

    await patch.patchTelegramLinkToken({ token });
    await patch.save();

    return res.status(200).json({ message: 'Telegram link token issued', token });
  });
}

// TODO: Write in docs. Verifies telegram link token
export async function postLinkTelegramTokenVerify(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);

    const { token } = req.body as { token: string };

    const user = await User.findOne({ telegramLinkToken: token });
    if (!user) throw new E404('User with this telegram link token is not found');

    const patch = new UserService({ user });

    await patch.patchTelegramLinkToken({ token: null });
    await patch.save();

    Logger.info(`[UserController]: Telegram link token verified and revoked for ${user.id}`);

    return res.status(200).json({ message: 'Token verified', verified: true, id: user.id });
  });
}



export async function createTogetherRoom(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    if (!req.nekomi.middlewaresPassed?.includes('checkAccess')) throw new ERR_MIDDLEWARE_REQUIRED(`checkAccess`);
    if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);

    const userId = req.nekomi.user?.id;
    const { titleId } = req.body as { titleId: string };

    const user = await UserModel.findOne({ id: userId });
    if (!user) throw new E404(`User ${userId} is not found`);

    const userService = new UserService({ user });

    const togetherRoomId = await userService.createTogetherRoom({ titleId });
    await userService.save();

    return res.status(200).json({ message: 'New together room created', id: togetherRoomId });
  });
}

export async function deleteTogetherRoom(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    if (!req.nekomi.middlewaresPassed?.includes('checkAccess')) throw new ERR_MIDDLEWARE_REQUIRED(`checkAccess`);
    if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);

    const userId = req.nekomi.user?.id;
    const { id } = req.params as { id: string };

    const user = await UserModel.findOne({ id: userId });
    if (!user) throw new E404(`User ${userId} is not found`);

    const userService = new UserService({ user });

    await userService.removeTogetherRoom({ id });
    await userService.save();

    return res.status(200).json({ message: 'Together room deleted' });
  });
}